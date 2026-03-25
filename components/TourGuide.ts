import { driver } from "driver.js";
import "driver.js/dist/driver.css";

const driverConfig = {
    showProgress: true,
    animate: true,
    allowClose: true,
    overlayColor: 'rgba(0, 0, 0, 0.6)',
    stagePadding: 5,
    popoverClass: 'driverjs-theme',
};

export const startDashboardTour = (onFinish?: () => void) => {
    const driverObj = driver({
        ...driverConfig,
        steps: [
            { 
                element: '#tour-welcome', 
                popover: { 
                    title: 'Welcome to Your Digital Laboratory! 🧪', 
                    description: 'Explore every NCERT concept through immersive, 3D simulations that make learning intuitive and unforgettable.', 
                    side: "bottom", 
                    align: 'center' 
                } 
            },
            { 
                element: '#tour-grade-selector', 
                popover: { 
                    title: 'Pick Your Curriculum 📚', 
                    description: 'Switch easily between Class 11 and Class 12. Each grade is packed with unique, interactive content.', 
                    side: "bottom", 
                    align: 'start' 
                } 
            },
            { 
                element: '#tour-subject-tabs', 
                popover: { 
                    title: 'Focus Your Study 🔬', 
                    description: 'Toggle between Physics, Chemistry, and Biology to find exactly the lab you need.', 
                    side: "bottom", 
                    align: 'center' 
                } 
            },
            {
                element: '#tour-topic-grid',
                popover: {
                    title: 'Explore Endless Discovery 🌌',
                    description: 'Browse our extensive library of topics. Click "See Live Demo" to jump into an interactive lab!',
                    side: "top",
                    align: 'center',
                    nextBtnText: 'Live Demo →'
                }
            }
        ],
        onDestroyStarted: (element, step, { state }) => {
            if (activeTourStepIsLast(step) && onFinish) {
                driverObj.destroy();
                onFinish();
            } else {
                driverObj.destroy();
            }
        }
    });

    // Helper to check if it's the last step
    const activeTourStepIsLast = (step: any) => {
        return step?.element === '#tour-topic-grid';
    };

    driverObj.drive();
};

export const startTopicTour = () => {
    const driverObj = driver({
        ...driverConfig,
        steps: [
            { 
                element: '#tour-simulation', 
                popover: { 
                    title: 'Interactive Simulation 🎮', 
                    description: 'This is a live physics engine! Interact with the controls, drag sliders, and watch the science react in real-time.', 
                    side: "right", 
                    align: 'start' 
                } 
            },
            { 
                element: '#tour-content', 
                popover: { 
                    title: 'Crystal Clear Notes 📖', 
                    description: 'Derivations, formulas, and diagrams tailored perfectly to your NCERT syllabus—all in one place.', 
                    side: "left", 
                    align: 'start' 
                } 
            },
            { 
                element: '#tour-real-world', 
                popover: { 
                    title: 'Science in the Real World 🌍', 
                    description: 'We bridge the gap between abstract theories and everyday life with relatable, concrete examples.', 
                    side: "top", 
                    align: 'center' 
                } 
            },
            { 
                element: '#tour-videos', 
                popover: { 
                    title: 'Visual Mastery 📺', 
                    description: 'Still need clarity? Watch hand-picked, high-quality videos to reinforce your understanding.', 
                    side: "top", 
                    align: 'center' 
                } 
            }
        ]
    });

    driverObj.drive();
};
