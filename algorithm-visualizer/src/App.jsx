import { useEffect, useState } from 'react';
import LandingPage from './pages/LandingPage';
import VisualizerPage from './pages/VisualizerPage';
import { DEFAULT_ALGORITHM_ID } from './algorithms';

export default function App() {
  const [route, setRoute] = useState({ view: 'landing', algoId: DEFAULT_ALGORITHM_ID });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [route]);

  if (route.view === 'app') {
    return (
      <VisualizerPage
        initialAlgorithmId={route.algoId}
        onHome={() => setRoute((r) => ({ ...r, view: 'landing' }))}
      />
    );
  }
  return <LandingPage onLaunch={(algoId) => setRoute({ view: 'app', algoId: algoId || DEFAULT_ALGORITHM_ID })} />;
}
