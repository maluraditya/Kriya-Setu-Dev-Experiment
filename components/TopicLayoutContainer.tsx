import React from 'react';
import { Info, ArrowLeft, Play } from 'lucide-react';
import { Topic } from '../types';
import TextbookContent from './TextbookContent';

interface TopicLayoutContainerProps {
    topic: Topic;
    onExit: () => void;
    SimulationComponent: React.ReactNode;
    ControlsComponent?: React.ReactNode;
    // Optional floating top nav specific to the simulation (e.g., view modes)
    FloatingNavComponent?: React.ReactNode;
    // Optional status badge (e.g., staggered/eclipsed warning)
    StatusBadgeComponent?: React.ReactNode;
}

const TopicLayoutContainer: React.FC<TopicLayoutContainerProps> = ({
    topic,
    onExit,
    SimulationComponent,
    ControlsComponent,
    FloatingNavComponent,
    StatusBadgeComponent
}) => {
    return (
        <div className="fixed inset-0 z-[100] bg-[#0f172a] bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-slate-800 via-slate-950 to-black text-slate-100 font-sans overflow-hidden flex flex-col lg:flex-row animate-in fade-in duration-500">

            {/* Back button sitting strictly on top */}
            <div
                className="absolute top-4 left-4 z-50 flex items-center gap-2 px-4 py-2 bg-slate-900/60 hover:bg-slate-800/80 backdrop-blur-md rounded-2xl text-white cursor-pointer border border-white/10 shadow-xl transition-all"
                onClick={onExit}
            >
                <ArrowLeft size={18} /> <span className="text-sm font-bold">Back to Curriculum</span>
            </div>

            {/* 1. Main Interaction Area (Left Side Desktop / Top Half Mobile) */}
            <div className="relative h-[55vh] flex-none lg:h-full lg:flex-1 flex flex-col items-center justify-center shrink-0 border-b lg:border-b-0 lg:border-r border-white/10 overflow-hidden bg-slate-900/50">

                {/* Optional Floating Top Nav */}
                {FloatingNavComponent && (
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1 p-1 bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl pointer-events-auto">
                        {FloatingNavComponent}
                    </div>
                )}

                {/* Optional Floating Status Badge */}
                {StatusBadgeComponent && (
                    <div className="absolute top-20 lg:top-4 lg:right-4 left-1/2 -translate-x-1/2 lg:translate-x-0 z-20 pointer-events-auto">
                        {StatusBadgeComponent}
                    </div>
                )}

                {/* Visual Canvas containing the Simulation element */}
                {/* flex-1 allows it to take up all remaining space ABOVE the controls without overlapping them */}
                <div className="flex-1 w-full flex items-center justify-center pointer-events-auto z-10 p-4 lg:p-8 relative min-h-0">
                    <div className="w-full h-full max-w-[1600px] max-h-[1600px] relative flex items-center justify-center">
                        {SimulationComponent}
                    </div>
                </div>

                {/* Bottom Control Bar / Overlay naturally flowing at the bottom */}
                {ControlsComponent && (
                    <div className="w-full px-4 pb-4 lg:px-8 lg:pb-8 shrink-0 flex justify-center z-30 pointer-events-auto">
                        <div className="w-full lg:w-[600px] xl:w-[700px] 2xl:w-[800px] bg-slate-900/90 backdrop-blur-2xl border border-white/10 shadow-2xl rounded-3xl p-4 md:p-6 flex flex-col gap-4">
                            {ControlsComponent}
                        </div>
                    </div>
                )}
            </div>

            {/* 2. Content Explorer Panel (Right Side Desktop / Bottom Half Mobile) */}
            <div className="flex-1 lg:flex-none w-full lg:w-[450px] xl:w-[500px] 2xl:w-[600px] shrink-0 bg-slate-50 lg:bg-white text-slate-900 overflow-y-auto custom-scrollbar lg:shadow-[-10px_0_30px_rgba(0,0,0,0.5)] z-40 relative">

                {/* Sticky Header with Navigation Breadcrumbs */}
                <div className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-10 px-8 py-4">
                    <div className="flex items-center gap-2 text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-widest">
                        <span>{topic.subject}</span>
                        <span className="text-slate-300">•</span>
                        <span>{topic.branch}</span>
                        <span className="text-slate-300">•</span>
                        <span className="text-brand-primary/80 truncate">{topic.unit}</span>
                    </div>
                </div>

                {/* Main Content Body */}
                <div className="p-8 pb-32 flex flex-col gap-8">

                    {/* The Legacy Textbook Content Component */}
                    <div className="prose prose-slate prose-lg max-w-none font-sans">
                        <TextbookContent topic={topic} layout="unified" />
                    </div>

                    {/* Video Section appended seamlessly */}
                    {topic.youtubeVideoIds && topic.youtubeVideoIds.length > 0 && (
                        <div>
                            <h3 className="font-display text-xl font-bold text-slate-800 border-b-2 border-brand-secondary inline-block pb-1 mb-4">Video Summary</h3>
                            <div className="flex flex-col gap-6">
                                {topic.youtubeVideoIds.map(vid => (
                                    <div key={vid} className="rounded-2xl overflow-hidden shadow-lg border border-slate-200 bg-black aspect-video relative group">
                                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none group-hover:opacity-0 transition-opacity z-10 w-full h-full text-white bg-black/20">
                                            {/* Minimal play icon overlay before load if needed */}
                                        </div>
                                        <iframe
                                            className="absolute top-0 left-0 w-full h-full"
                                            src={`https://www.youtube-nocookie.com/embed/${vid}?rel=0&modestbranding=1`}
                                            title="Educational Video"
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                            allowFullScreen
                                        ></iframe>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TopicLayoutContainer;
