
import React, { useState } from 'react';
import { BookOpen, Activity, Zap, PlayCircle, Loader2, Box, Magnet, FlaskConical, Layers, Cuboid, Grid, Percent, AlertTriangle, Atom, Microscope, Wind, Sparkles } from 'lucide-react';
import { Subject, Topic } from '../types';

interface DashboardProps {
  onSelectTopic: (topicId: string) => void;
  activeSubject: Subject;
  setActiveSubject: (subject: Subject) => void;
  images: Record<string, string>;
  setImages: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  topics: Topic[];
}

const Dashboard: React.FC<DashboardProps> = ({ onSelectTopic, activeSubject, setActiveSubject, images, setImages, topics }) => {
  // Using cover images from data.ts, no dynamic generation needed
  const [loadingState, setLoadingState] = useState<Record<string, boolean>>({});
  const filteredTopics = topics.filter(t => t.subject === activeSubject);

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'activity': return <Activity size={80} className="text-brand-primary/20" />;
      case 'zap': return <Zap size={80} className="text-brand-secondary/80" />;
      case 'box': return <Box size={80} className="text-brand-primary/20" />;
      case 'magnet': return <Magnet size={80} className="text-brand-secondary/80" />;
      case 'flask': return <FlaskConical size={80} className="text-brand-primary/20" />;
      case 'layers': return <Layers size={80} className="text-brand-secondary/80" />;
      case 'cuboid': return <Cuboid size={80} className="text-brand-primary/20" />;
      case 'grid': return <Grid size={80} className="text-brand-secondary/80" />;
      case 'percent': return <Percent size={80} className="text-brand-primary/20" />;
      case 'alert': return <AlertTriangle size={80} className="text-brand-secondary/80" />;
      default: return <Activity size={80} className="text-brand-primary/20" />;
    }
  };

  const SubjectTab = ({ subject, icon: Icon, color }: { subject: Subject, icon: any, color: string }) => (
    <button
      onClick={() => setActiveSubject(subject)}
      className={`flex flex-col items-center gap-3 p-6 rounded-2xl border-2 transition-all duration-300 ${activeSubject === subject
        ? `bg-white border-${color} shadow-xl scale-105`
        : 'bg-white/50 border-transparent hover:border-slate-300 opacity-60 hover:opacity-100'
        }`}
    >
      <div className={`p-4 rounded-xl ${activeSubject === subject ? `bg-${color}/10 text-${color}` : 'bg-slate-100 text-slate-400'}`}>
        <Icon size={32} />
      </div>
      <span className={`font-display font-bold text-sm uppercase tracking-widest ${activeSubject === subject ? 'text-slate-900' : 'text-slate-500'}`}>
        {subject}
      </span>
      {activeSubject === subject && (
        <div className={`h-1.5 w-8 rounded-full bg-${color}`}></div>
      )}
    </button>
  );

  return (
    <div className="max-w-[1400px] mx-auto p-3 sm:p-4 md:p-8 lg:p-12 relative min-h-screen overflow-x-hidden">
      {/* Background Ambience */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-brand-primary/10 rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="absolute top-[20%] right-[-10%] w-[40%] h-[60%] bg-brand-secondary/10 rounded-full blur-[120px] pointer-events-none -z-10" />

      {/* Hero Section */}
      <div className="text-center mb-10 sm:mb-16 space-y-4 sm:space-y-6 pt-4 sm:pt-8">
        <div className="inline-block px-4 py-1.5 rounded-full bg-slate-900/5 border border-slate-900/10 backdrop-blur-md mb-4 animate-in fade-in slide-in-from-bottom-2 duration-700">
          <span className="text-xs font-bold tracking-widest uppercase bg-gradient-to-r from-brand-primary to-brand-secondary bg-clip-text text-transparent">
            Next-Gen Interactive Learning
          </span>
        </div>
        <h2 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-display font-extrabold text-slate-900 tracking-tight leading-tight animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
          Don’t Just Study. <br />
          <span className="bg-gradient-to-r from-brand-primary via-indigo-500 to-brand-secondary bg-clip-text text-transparent drop-shadow-sm">
            Experience It.
          </span>
        </h2>
        <p className="text-sm sm:text-lg md:text-xl text-slate-500 max-w-2xl mx-auto font-sans leading-relaxed animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200 px-2">
          Explore every NCERT concept through immersive simulations that make learning intuitive, clear, and unforgettable.
        </p>
      </div>

      {/* Subject Category Layer - Glassmorphism */}
      <div className="flex flex-wrap justify-center gap-3 sm:gap-4 md:gap-6 mb-10 sm:mb-20 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300" id="tour-subject-tabs">
        <button
          onClick={() => setActiveSubject('Physics')}
          className={`group relative flex flex-col items-center gap-2 sm:gap-3 px-5 sm:px-8 md:px-10 py-4 sm:py-6 md:py-8 rounded-2xl sm:rounded-[2rem] transition-all duration-500 overflow-hidden ${activeSubject === 'Physics'
            ? 'bg-blue-500 text-white shadow-[0_20px_40px_-15px_rgba(59,130,246,0.5)] scale-105 border border-blue-400'
            : 'bg-white/40 backdrop-blur-xl border border-white/60 text-slate-600 hover:bg-white/80 hover:shadow-xl hover:-translate-y-1'
            }`}
        >
          {activeSubject === 'Physics' && <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />}
          <div className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl transition-all duration-300 ${activeSubject === 'Physics' ? 'bg-white/20 shadow-inner' : 'bg-slate-100/80 group-hover:bg-blue-100 group-hover:text-blue-500 group-hover:scale-110'}`}>
            <Wind size={28} className="sm:hidden" strokeWidth={activeSubject === 'Physics' ? 2.5 : 2} />
            <Wind size={36} className="hidden sm:block" strokeWidth={activeSubject === 'Physics' ? 2.5 : 2} />
          </div>
          <span className="font-display font-bold text-sm sm:text-lg tracking-wide z-10">Physics</span>
        </button>

        <button
          onClick={() => setActiveSubject('Chemistry')}
          className={`group relative flex flex-col items-center gap-2 sm:gap-3 px-5 sm:px-8 md:px-10 py-4 sm:py-6 md:py-8 rounded-2xl sm:rounded-[2rem] transition-all duration-500 overflow-hidden ${activeSubject === 'Chemistry'
            ? 'bg-rose-500 text-white shadow-[0_20px_40px_-15px_rgba(244,63,94,0.5)] scale-105 border border-rose-400'
            : 'bg-white/40 backdrop-blur-xl border border-white/60 text-slate-600 hover:bg-white/80 hover:shadow-xl hover:-translate-y-1'
            }`}
        >
          {activeSubject === 'Chemistry' && <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />}
          <div className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl transition-all duration-300 ${activeSubject === 'Chemistry' ? 'bg-white/20 shadow-inner' : 'bg-slate-100/80 group-hover:bg-rose-100 group-hover:text-rose-500 group-hover:scale-110'}`}>
            <FlaskConical size={28} className="sm:hidden" strokeWidth={activeSubject === 'Chemistry' ? 2.5 : 2} />
            <FlaskConical size={36} className="hidden sm:block" strokeWidth={activeSubject === 'Chemistry' ? 2.5 : 2} />
          </div>
          <span className="font-display font-bold text-sm sm:text-lg tracking-wide z-10">Chemistry</span>
        </button>

        <button
          onClick={() => setActiveSubject('Biology')}
          className={`group relative flex flex-col items-center gap-2 sm:gap-3 px-5 sm:px-8 md:px-10 py-4 sm:py-6 md:py-8 rounded-2xl sm:rounded-[2rem] transition-all duration-500 overflow-hidden ${activeSubject === 'Biology'
            ? 'bg-emerald-500 text-white shadow-[0_20px_40px_-15px_rgba(16,185,129,0.5)] scale-105 border border-emerald-400'
            : 'bg-white/40 backdrop-blur-xl border border-white/60 text-slate-600 hover:bg-white/80 hover:shadow-xl hover:-translate-y-1'
            }`}
        >
          {activeSubject === 'Biology' && <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />}
          <div className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl transition-all duration-300 ${activeSubject === 'Biology' ? 'bg-white/20 shadow-inner' : 'bg-slate-100/80 group-hover:bg-emerald-100 group-hover:text-emerald-500 group-hover:scale-110'}`}>
            <Microscope size={28} className="sm:hidden" strokeWidth={activeSubject === 'Biology' ? 2.5 : 2} />
            <Microscope size={36} className="hidden sm:block" strokeWidth={activeSubject === 'Biology' ? 2.5 : 2} />
          </div>
          <span className="font-display font-bold text-sm sm:text-lg tracking-wide z-10">Biology</span>
        </button>
      </div>

      {/* Topics Grid */}
      {filteredTopics.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-8 xl:gap-10">
          {filteredTopics.map((topic, index) => {
            // Apply theme colors based on subject
            let themeColor = 'blue';
            if (topic.subject === 'Chemistry') themeColor = 'rose';
            if (topic.subject === 'Biology') themeColor = 'emerald';

            return (
              <div
                key={topic.id}
                onClick={() => onSelectTopic(topic.id)}
                className={`group relative bg-white/60 backdrop-blur-xl rounded-2xl sm:rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] hover:-translate-y-2 transition-all duration-500 cursor-pointer overflow-hidden border border-white/80 flex flex-col min-h-[380px] sm:min-h-[480px] md:h-[520px] animate-in fade-in slide-in-from-bottom-8`}
                style={{ animationFillMode: 'both', animationDelay: `${300 + index * 100}ms` }}
              >
                {/* Glow Effect on Hover */}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white/90 z-10 pointer-events-none transition-opacity duration-500 opacity-80 group-hover:opacity-100" />

                <div className="h-44 sm:h-56 md:h-64 w-full bg-slate-100 relative overflow-hidden">
                  {topic.coverImage || topic.thumbnailUrl || images[topic.id] ? (
                    <>
                      <div className="absolute inset-0 bg-slate-900/10 group-hover:bg-transparent transition-colors duration-500 z-10" />
                      <img
                        src={topic.coverImage || topic.thumbnailUrl || images[topic.id]}
                        alt={topic.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                    </>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
                      {loadingState[topic.id] ? (
                        <div className="flex flex-col items-center text-slate-400 animate-pulse">
                          <Loader2 size={48} className="animate-spin mb-2" />
                          <span className="text-xs font-bold tracking-widest uppercase">Generating...</span>
                        </div>
                      ) : (
                        getIcon(topic.thumbnailIcon)
                      )}
                    </div>
                  )}

                  {/* Floating Tags */}
                  <div className={`absolute top-5 right-5 bg-${themeColor}-500/90 backdrop-blur-md px-4 py-1.5 rounded-xl text-[10px] font-bold text-white uppercase tracking-wider shadow-lg transform transition-transform duration-500 group-hover:scale-105 z-20`}>
                    {topic.branch}
                  </div>
                  <div className="absolute bottom-5 left-5 bg-white/95 backdrop-blur-md px-4 py-1.5 rounded-full text-[10px] font-bold text-slate-700 uppercase tracking-wider shadow-lg border border-white/50 transform transition-transform duration-500 group-hover:-translate-y-1 z-20">
                    {topic.unit}
                  </div>
                </div>

                <div className="p-5 sm:p-8 flex-1 flex flex-col justify-between relative z-20 bg-gradient-to-b from-transparent to-white">
                  <div>
                    <h3 className="text-lg sm:text-2xl font-bold text-slate-800 font-display mb-2 sm:mb-3 leading-tight group-hover:text-slate-900 transition-colors">
                      {topic.title}
                    </h3>
                    <p className="text-slate-500 font-sans leading-relaxed line-clamp-3 text-sm">
                      {topic.description}
                    </p>
                  </div>
                  <div className="flex items-center justify-between mt-6 pt-6 border-t border-slate-100/50">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest group-hover:text-slate-600 transition-colors">
                      <PlayCircle size={18} className={`text-${themeColor}-500`} />
                      {topic.youtubeVideoIds.length} Videos
                    </div>
                    <button className={`bg-slate-900 text-white px-4 sm:px-5 py-2 sm:py-2.5 rounded-full font-semibold shadow-md text-xs sm:text-sm group-hover:bg-${themeColor}-500 group-hover:shadow-[0_4px_14px_0_rgba(0,0,0,0.2)] hover:scale-105 active:scale-95 transition-all duration-300 flex items-center gap-2`}>
                      Launch Lab <Sparkles size={14} className="opacity-70 group-hover:opacity-100" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-32 bg-white/40 backdrop-blur-xl rounded-[3rem] border border-white/60 shadow-xl animate-in fade-in slide-in-from-bottom-8 duration-700 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent pointer-events-none" />
          <div className="w-24 h-24 bg-white rounded-3xl shadow-sm border border-slate-100 flex items-center justify-center mx-auto mb-8 relative z-10">
            <Atom size={48} className="text-slate-300 animate-[spin_10s_linear_infinite]" />
          </div>
          <h3 className="text-3xl font-display font-bold text-slate-800 mb-3 relative z-10">Coming Soon</h3>
          <p className="text-lg text-slate-500 max-w-md mx-auto relative z-10">We are currently developing next-generation {activeSubject} simulations.</p>
          <button
            onClick={() => setActiveSubject('Chemistry')}
            className="mt-8 text-brand-primary font-bold hover:text-brand-secondary transition-colors relative z-10 px-6 py-3 rounded-full bg-white shadow-sm hover:shadow-md"
          >
            Explore Available Labs
          </button>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
