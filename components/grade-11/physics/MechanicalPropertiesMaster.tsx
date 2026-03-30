import React, { useState } from 'react';
import { Topic } from '../../../types';
import TensileTestCanvas from './TensileTestCanvas';
import YoungsModulusLab from './YoungsModulusLab';

interface Props {
    topic: Topic;
    onExit: () => void;
}

const MechanicalPropertiesMaster: React.FC<Props> = ({ topic, onExit }) => {
    const [mode, setMode] = useState<'tensile' | 'youngs'>('tensile');

    if (mode === 'tensile') {
        return <TensileTestCanvas topic={topic} onExit={onExit} mode={mode} setMode={setMode} />;
    } else {
        return <YoungsModulusLab topic={topic} onExit={onExit} mode={mode} setMode={setMode} />;
    }
};

export default MechanicalPropertiesMaster;
