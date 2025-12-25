
import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { LessonContent, Subject, ClassLevel, Chapter, MCQItem, ContentType } from '../types';
import { ArrowLeft, Clock, AlertTriangle, ExternalLink, CheckCircle, XCircle, Trophy, BookOpen, Play, List, SkipForward } from 'lucide-react';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import ReactPlayer from 'react-player';

interface Props {
  content: LessonContent | null;
  subject: Subject;
  classLevel: ClassLevel;
  chapter: Chapter;
  loading: boolean;
  onBack: () => void;
  onMCQComplete?: (count: number) => void; 
}

export const LessonView: React.FC<Props> = ({ 
  content, 
  subject, 
  classLevel, 
  chapter,
  loading, 
  onBack,
  onMCQComplete
}) => {
  // --- TOP LEVEL HOOKS (STRICT REQUIREMENT) ---
  const [mcqState, setMcqState] = useState<Record<number, number | null>>({});
  const [showResults, setShowResults] = useState(false);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [isVideoReady, setIsVideoReady] = useState(false);

  // Reset states when content changes
  useEffect(() => {
    setMcqState({});
    setShowResults(false);
    setCurrentVideoIndex(0);
    setIsVideoReady(false);
  }, [content?.id]);

  // Derived State (Safe Guards)
  const isMcq = content?.type === 'MCQ_ANALYSIS' || content?.type === 'MCQ_SIMPLE';
  const isVideo = content?.type === 'VIDEO_LECTURE';
  const isPdf = content?.type === 'PDF_VIEWER' || content?.type === 'PDF_FREE' || content?.type === 'PDF_PREMIUM' || content?.type === 'PDF_ULTRA';
  const isHtml = content?.type === 'NOTES_HTML_FREE' || content?.type === 'NOTES_HTML_PREMIUM';
  const isNotes = content?.type === 'NOTES_SIMPLE' || content?.type === 'NOTES_PREMIUM';
  
  // Safe Playlist Logic
  const playlist = (content?.videoPlaylist && content.videoPlaylist.length > 0) 
      ? content.videoPlaylist 
      : (content?.content ? [{ title: chapter.title, url: content.content }] : []);
  
  const currentVideo = playlist.length > 0 && playlist[currentVideoIndex] ? playlist[currentVideoIndex] : null;

  // --- LOADING STATE ---
  if (loading) {
      return (
          <div className="h-[70vh] flex flex-col items-center justify-center text-center p-8">
              <div className="w-16 h-16 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin mb-4"></div>
              <h3 className="text-xl font-bold text-slate-800 animate-pulse">Loading Content...</h3>
              <p className="text-slate-500 text-sm">Please wait while we fetch the data.</p>
          </div>
      );
  }

  // --- NULL GUARD (STRICT REQUIREMENT) ---
  if (!content) {
       return (
          <div className="h-[70vh] flex flex-col items-center justify-center text-center p-8 bg-slate-50 rounded-2xl m-4 border-2 border-dashed border-slate-200">
              <AlertTriangle size={64} className="text-red-400 mb-4 opacity-80" />
              <h2 className="text-2xl font-black text-slate-800 mb-2">Content Unavailable</h2>
              <p className="text-slate-600 max-w-xs mx-auto mb-6">
                  We couldn't load this lesson. Please try again later or contact support.
              </p>
              <button onClick={onBack} className="mt-8 text-slate-400 font-bold hover:text-slate-600">
                  Go Back
              </button>
          </div>
      );
  }

  // --- COMING SOON ---
  if (content.isComingSoon) {
      return (
          <div className="h-[70vh] flex flex-col items-center justify-center text-center p-8 bg-slate-50 rounded-2xl m-4 border-2 border-dashed border-slate-200">
              <Clock size={64} className="text-orange-400 mb-4 opacity-80" />
              <h2 className="text-2xl font-black text-slate-800 mb-2">Coming Soon</h2>
              <p className="text-slate-600 max-w-xs mx-auto mb-6">
                  This content is currently being prepared by the Admin.
              </p>
              <button onClick={onBack} className="mt-8 text-slate-400 font-bold hover:text-slate-600">
                  Go Back
              </button>
          </div>
      );
  }

  // --- MCQ RENDERER ---
  if (isMcq && content.mcqData) {
      const score = Object.keys(mcqState).reduce((acc, key) => {
          const qIdx = parseInt(key);
          return acc + (mcqState[qIdx] === content.mcqData![qIdx].correctAnswer ? 1 : 0);
      }, 0);

      const handleFinish = () => {
          setShowResults(true);
          if (onMCQComplete && content.mcqData) onMCQComplete(score);
      };

      return (
          <div className="flex flex-col h-full bg-slate-50 animate-in fade-in">
               <div className="flex items-center justify-between p-4 bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
                   <button onClick={onBack} className="flex items-center gap-2 text-slate-600 font-bold text-sm bg-slate-100 px-3 py-2 rounded-lg hover:bg-slate-200 transition-colors">
                       <ArrowLeft size={16} /> Exit
                   </button>
                   <div className="text-right">
                       <h3 className="font-bold text-slate-800 text-sm">MCQ Test</h3>
                       {showResults ? (
                           <span className="text-xs font-bold text-green-600">Final Score: {score}/{content.mcqData.length}</span>
                       ) : (
                           <span className="text-xs text-slate-400">{Object.keys(mcqState).length}/{content.mcqData.length} Answered</span>
                       )}
                   </div>
               </div>
               
               <div className="flex-1 overflow-y-auto p-4 space-y-6 max-w-3xl mx-auto w-full pb-20">
                   {content.mcqData.map((q, idx) => {
                       const userAnswer = mcqState[idx];
                       const isAnswered = userAnswer !== undefined && userAnswer !== null;
                       const isCorrect = userAnswer === q.correctAnswer;
                       
                       return (
                           <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm transition-all hover:shadow-md">
                               <h4 className="font-bold text-slate-800 mb-4 flex gap-3 leading-relaxed">
                                   <span className="bg-blue-100 text-blue-700 w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0 font-bold mt-0.5">{idx + 1}</span>
                                   {q.question}
                               </h4>
                               <div className="space-y-2">
                                   {q.options.map((opt, oIdx) => {
                                       let btnClass = "w-full text-left p-3 rounded-xl border transition-all text-sm font-medium relative overflow-hidden ";
                                       
                                       // IMMEDIATE FEEDBACK LOGIC
                                       // If answered, show Red/Green immediately for this question
                                       if (isAnswered) {
                                           if (oIdx === q.correctAnswer) {
                                               // Always show correct answer as Green
                                               btnClass += "bg-green-100 border-green-300 text-green-800";
                                           } else if (userAnswer === oIdx) {
                                               // Selected Wrong Option -> Red
                                               btnClass += "bg-red-100 border-red-300 text-red-800";
                                           } else {
                                               // Other Options -> Dimmed
                                               btnClass += "bg-slate-50 border-slate-100 opacity-60";
                                           }
                                       } else {
                                           // Not Answered Yet -> Standard State
                                           btnClass += "bg-white border-slate-200 hover:bg-slate-50 hover:border-blue-200";
                                       }

                                       return (
                                           <button 
                                               key={oIdx}
                                               disabled={isAnswered || showResults} // Lock after answering
                                               onClick={() => setMcqState(prev => ({ ...prev, [idx]: oIdx }))}
                                               className={btnClass}
                                           >
                                               <span className="relative z-10 flex justify-between items-center">
                                                   {opt}
                                                   {isAnswered && oIdx === q.correctAnswer && <CheckCircle size={16} className="text-green-600" />}
                                                   {isAnswered && userAnswer === oIdx && userAnswer !== q.correctAnswer && <XCircle size={16} className="text-red-500" />}
                                               </span>
                                           </button>
                                       );
                                   })}
                               </div>
                               
                               {/* Show Explanation Immediately if Answered */}
                               {(isAnswered || showResults) && (
                                   <div className="mt-4 pt-4 border-t border-slate-100 animate-in slide-in-from-top-2">
                                       <div className={`flex items-center gap-2 text-sm font-bold mb-1 ${isCorrect ? 'text-green-600' : 'text-red-500'}`}>
                                           {isCorrect ? <CheckCircle size={16} /> : <XCircle size={16} />}
                                           {isCorrect ? 'Correct Answer' : 'Incorrect'}
                                       </div>
                                       {q.explanation && q.explanation !== "Answer Key Provided" && (
                                            <p className="text-slate-600 text-sm bg-slate-50 p-3 rounded-lg border border-slate-200 mt-2">
                                                <span className="font-bold text-slate-800 block text-xs uppercase mb-1">Explanation:</span>
                                                {q.explanation}
                                            </p>
                                       )}
                                   </div>
                               )}
                           </div>
                       );
                   })}
               </div>

               {!showResults && (
                   <div className="p-4 bg-white border-t border-slate-200 sticky bottom-0 z-10 flex justify-center shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                       <button 
                           onClick={handleFinish}
                           disabled={Object.keys(mcqState).length === 0}
                           className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold py-3 px-10 rounded-xl shadow-lg transition-all active:scale-95 flex items-center gap-2"
                       >
                           <Trophy size={18} /> Submit Final Score
                       </button>
                   </div>
               )}
          </div>
      );
  }

  // --- VIDEO RENDERER (Playlist Support) ---
  if (isVideo) {
      if (!currentVideo) {
          return (
             <div className="h-[70vh] flex flex-col items-center justify-center text-center p-8 bg-slate-900 text-white">
                 <AlertTriangle size={64} className="text-yellow-500 mb-4" />
                 <h2 className="text-xl font-bold mb-2">Video Unavailable</h2>
                 <p className="text-slate-400 text-sm mb-6">No valid video URL found.</p>
                 <button onClick={onBack} className="text-slate-300 hover:text-white font-bold underline">Go Back</button>
             </div>
          );
      }

      return (
          <div className="flex flex-col h-[calc(100vh-80px)] bg-slate-900">
              <div className="flex items-center justify-between p-3 bg-slate-800 border-b border-slate-700 shadow-sm">
                   <button onClick={onBack} className="flex items-center gap-2 text-slate-300 font-bold text-sm hover:text-white">
                       <ArrowLeft size={18} /> Back
                   </button>
                   <h3 className="font-bold text-white text-sm truncate max-w-[200px]">{currentVideo.title}</h3>
                   <div className="flex items-center gap-2">
                      {playlist.length > 1 && (
                          <span className="text-xs font-mono bg-slate-700 px-2 py-1 rounded text-slate-300">
                              {currentVideoIndex + 1} / {playlist.length}
                          </span>
                      )}
                   </div>
              </div>
              
              <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                  <div className="flex-1 bg-black relative flex items-center justify-center">
                      <div className="w-full h-full aspect-video">
                          <ReactPlayer
                              url={currentVideo.url}
                              width="100%"
                              height="100%"
                              controls={true}
                              playing={true}
                              onEnded={() => {
                                  if (currentVideoIndex < playlist.length - 1) {
                                      setCurrentVideoIndex(prev => prev + 1);
                                  }
                              }}
                              config={{
                                  youtube: {
                                      playerVars: { showinfo: 1 }
                                  }
                              }}
                          />
                      </div>
                  </div>
                  
                  {/* Playlist Sidebar */}
                  {playlist.length > 1 && (
                      <div className="w-full md:w-80 bg-slate-900 border-l border-slate-800 flex flex-col h-[30vh] md:h-auto">
                          <div className="p-3 bg-slate-800 font-bold text-white text-xs uppercase tracking-widest border-b border-slate-700 flex items-center gap-2">
                              <List size={14} /> Playlist ({playlist.length})
                          </div>
                          <div className="flex-1 overflow-y-auto p-2 space-y-2">
                              {playlist.map((vid, idx) => (
                                  <button 
                                      key={idx}
                                      onClick={() => setCurrentVideoIndex(idx)}
                                      className={`w-full p-3 rounded-lg flex gap-3 items-center text-left transition-all ${
                                          idx === currentVideoIndex 
                                          ? 'bg-blue-600 text-white shadow-lg border border-blue-400' 
                                          : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700 hover:text-slate-200 border border-transparent'
                                      }`}
                                  >
                                      <div className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold ${idx === currentVideoIndex ? 'bg-white/20' : 'bg-slate-700'}`}>
                                          {idx + 1}
                                      </div>
                                      <div className="flex-1 truncate">
                                          <p className="font-bold text-xs truncate">{vid.title}</p>
                                          <p className="text-[10px] opacity-60">Video Lecture</p>
                                      </div>
                                      {idx === currentVideoIndex && <Play size={12} fill="currentColor" />}
                                  </button>
                              ))}
                          </div>
                      </div>
                  )}
              </div>
          </div>
      );
  }
  
  // --- PDF / EXTERNAL LINK RENDERER ---
  if (isPdf) {
      if (!content.content) return <div className="p-8 text-center">Invalid PDF Link</div>;
      
      const isGoogleDrive = content.content.includes('drive.google.com') || content.content.includes('docs.google.com');
      const isDirectPdf = content.content.toLowerCase().endsWith('.pdf');
      
      // Convert view/edit links to preview for embedding
      let embedUrl = content.content;
      if (isGoogleDrive) {
          embedUrl = content.content.replace('/view', '/preview').replace('/edit', '/preview');
      }

      return (
          <div className="flex flex-col h-[calc(100vh-80px)] bg-slate-100">
              <div className="flex items-center justify-between p-3 bg-white border-b border-slate-200 shadow-sm">
                   <button onClick={onBack} className="flex items-center gap-2 text-slate-600 font-bold text-sm hover:text-slate-900">
                       <ArrowLeft size={18} /> Back
                   </button>
                   <h3 className="font-bold text-slate-800 text-sm truncate max-w-[200px]">{chapter.title}</h3>
                   <div className="w-10"></div>
              </div>
              
              <div className="flex-1 w-full bg-white relative overflow-hidden">
                  {isGoogleDrive || isDirectPdf ? (
                     <div className="relative w-full h-full">
                        <iframe 
                             src={embedUrl} 
                             className="w-full h-full border-0" 
                             allowFullScreen
                             title="PDF Viewer"
                         />
                         {/* TRANSPARENT BLOCKER for Top-Right 'Pop-out' Button on Google Drive */}
                         {isGoogleDrive && <div className="absolute top-0 right-0 w-20 h-20 z-10 bg-transparent"></div>}
                     </div>
                  ) : (
                      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                          <ExternalLink size={48} className="text-slate-400 mb-4" />
                          <h3 className="text-xl font-bold text-slate-700 mb-2">External Content</h3>
                          <p className="text-slate-500 mb-6 max-w-md">
                              This content is hosted externally and cannot be embedded directly.
                          </p>
                          <a 
                              href={content.content} 
                              target="_blank" 
                              rel="noreferrer"
                              className="bg-blue-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-blue-700"
                          >
                              Open Link
                          </a>
                      </div>
                  )}
              </div>
          </div>
      );
  }

  // --- HTML NOTES RENDERER ---
  if (isHtml) {
      if (!content.content) return <div className="p-8 text-center">No Content Available</div>;

      return (
        <div className="bg-white min-h-screen pb-20 animate-in fade-in">
           {/* Header */}
           <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm border-b border-slate-100 px-4 py-3 flex items-center justify-between shadow-sm">
               <button onClick={onBack} className="p-2 -ml-2 text-slate-500 hover:text-slate-900 transition-colors">
                   <ArrowLeft size={20} />
               </button>
               <div className="text-center">
                   <h3 className="font-bold text-slate-800 text-sm leading-tight">{chapter.title}</h3>
                   <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">{content.type === 'NOTES_HTML_PREMIUM' ? 'Premium Notes' : 'Free Notes'}</p>
               </div>
               <div className="w-8"></div>
           </div>

           {/* Content */}
           <div className="max-w-3xl mx-auto p-6 md:p-10">
               <div 
                   className="prose prose-slate max-w-none prose-img:rounded-xl prose-headings:text-slate-800 prose-a:text-blue-600"
                   dangerouslySetInnerHTML={{ __html: content.content }}
               />
               
               <div className="mt-12 pt-8 border-t border-slate-100 text-center">
                   <p className="text-xs text-slate-400 font-medium mb-4">End of Chapter</p>
                   <button onClick={onBack} className="bg-slate-900 text-white font-bold py-3 px-8 rounded-full shadow-lg hover:bg-slate-800 transition-all active:scale-95">
                       Complete & Close
                   </button>
               </div>
           </div>
        </div>
      );
  }

  // --- NOTES (MARKDOWN) RENDERER (DEFAULT FALLBACK) ---
  return (
    <div className="bg-white min-h-screen pb-20 animate-in fade-in">
       {/* Notes Header */}
       <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm border-b border-slate-100 px-4 py-3 flex items-center justify-between shadow-sm">
           <button onClick={onBack} className="p-2 -ml-2 text-slate-500 hover:text-slate-900 transition-colors">
               <ArrowLeft size={20} />
           </button>
           <div className="text-center">
               <h3 className="font-bold text-slate-800 text-sm leading-tight">{chapter.title}</h3>
               <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">{content.subtitle}</p>
           </div>
           <div className="w-8"></div> {/* Spacer to balance Back button */}
       </div>

       {/* Notes Body */}
       <div className="max-w-3xl mx-auto p-6 md:p-10">
           <div className="prose prose-slate prose-headings:text-slate-800 prose-p:text-slate-600 prose-li:text-slate-600 prose-strong:text-slate-900 prose-a:text-blue-600 max-w-none">
               <ReactMarkdown 
                   remarkPlugins={[remarkMath]} 
                   rehypePlugins={[rehypeKatex]}
                   components={{
                       h1: ({node, ...props}) => <h1 className="text-2xl font-black mb-4 pb-2 border-b border-slate-100" {...props} />,
                       h2: ({node, ...props}) => <h2 className="text-xl font-bold mt-8 mb-4 text-blue-800 flex items-center gap-2" {...props} />,
                       ul: ({node, ...props}) => <ul className="list-disc pl-5 space-y-2 my-4" {...props} />,
                       li: ({node, ...props}) => <li className="pl-1" {...props} />,
                       blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-blue-500 pl-4 py-2 my-6 bg-blue-50 rounded-r-lg italic text-blue-800" {...props} />,
                       code: ({node, ...props}) => <code className="bg-slate-100 text-pink-600 px-1.5 py-0.5 rounded text-sm font-mono font-bold" {...props} />,
                   }}
               >
                   {content.content || ''}
               </ReactMarkdown>
           </div>
           
           <div className="mt-12 pt-8 border-t border-slate-100 text-center">
               <p className="text-xs text-slate-400 font-medium mb-4">End of Chapter</p>
               <button onClick={onBack} className="bg-slate-900 text-white font-bold py-3 px-8 rounded-full shadow-lg hover:bg-slate-800 transition-all active:scale-95">
                   Complete & Close
               </button>
           </div>
       </div>
    </div>
  );
};
