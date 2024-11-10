import React, { useState, useEffect, useRef } from 'react';
import {
  Card,
  CardContent,
  Button,
  Tabs,
  Tab,
  Select,
  MenuItem,
  TextField,
  Typography,
  Box,
  Switch,
  FormControlLabel
} from '@mui/material';
import { 
  PlayArrow,
  Pause,
  SkipPrevious,
  ArrowForward,
  Upload,
  Shuffle,
  ZoomIn,
  ZoomOut 
} from '@mui/icons-material';
import { createTheme, ThemeProvider } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#8963f4',
    },
  },
});

const VisualizerComponent = () => {

  const [activeTab, setActiveTab] = useState("closestPair");
  const [points, setPoints] = useState([]);
  const [originalPoints, setOriginalPoints] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [steps, setSteps] = useState([]);
  const [numbers, setNumbers] = useState({ num1: '', num2: '' });
  const [animationSpeed] = useState(1000);
  const [result, setResult] = useState(null);
  const [algorithm, setAlgorithm] = useState('bruteforce');
  const [multiplicationPairs, setMultiplicationPairs] = useState([]);
  const fileInputRef = useRef(null);
  const [zoom, setZoom] = useState(1);
  const [showLabels, setShowLabels] = useState(false);
  const [bruteForceResult, setBruteForceResult] = useState(null);
  const multiplicationFileRef = useRef(null);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const svgRef = useRef(null);
  const [multAlgorithm, setMultAlgorithm] = useState('bruteforce');

    // Modified SVG viewBox calculation to handle dragging properly
    const getViewBox = () => {
      const baseWidth = 500 * zoom;
      const baseHeight = 300 * zoom;
      const offsetX = (-50 * zoom) - (pan.x / zoom);
      const offsetY = (-50 * zoom) - (pan.y / zoom);
      return `${offsetX} ${offsetY} ${baseWidth} ${baseHeight}`;
    };
  

    // Pan handling functions
    const handleMouseDown = (e) => {
      if (e.button === 0) { // Left click only
        setIsDragging(true);
        setDragStart({
          x: e.clientX - pan.x,
          y: e.clientY - pan.y
        });
      }
    };
  
    const handleMouseMove = (e) => {
      if (isDragging) {
        setPan({
          x: e.clientX - dragStart.x,
          y: e.clientY - dragStart.y
        });
      }
    };
  
    const handleMouseUp = () => {
      setIsDragging(false);
    };
  

    const distance = (p1, p2) => {
        return Math.sqrt(
          Math.pow(p2.originalX - p1.originalX, 2) + Math.pow(p2.originalY - p1.originalY, 2)
        );
      };
      

  // Utility Functions remain same until scalePoint
  const scalePoint = (point) => ({
    x: (point.x * 3 + 50) * 0.5,
    y: (point.y * 3 + 50) * 0.5,
    originalX: point.x,
    originalY: point.y
  });

  // Modified generatePoints to handle both algorithms
  const generatePoints = () => {
    const newOriginalPoints = Array.from({ length: 10 }, () => ({
      x: Math.floor(Math.random() * 200),
      y: Math.floor(Math.random() * 100)
    }));
    
    const newScaledPoints = newOriginalPoints.map(point => scalePoint(point));
    setOriginalPoints(newOriginalPoints);
    setPoints(newScaledPoints);
    
    // Run both algorithms for comparison
    generateBruteForceSteps(newScaledPoints);
    if (algorithm === 'divideconquer') {
      generateDivideConquerSteps(newScaledPoints);
    }
  };

  // Existing Brute Force Implementation remains same...
  const generateBruteForceSteps = (pointsArray) => {
    const steps = [];
    let minDist = Infinity;
    let bestPair = null;

    for (let i = 0; i < pointsArray.length; i++) {
      for (let j = i + 1; j < pointsArray.length; j++) {
        const dist = distance(pointsArray[i], pointsArray[j]);

        steps.push({
          type: 'compare',
          message: `Comparing points ${i} and ${j}: Distance = ${dist.toFixed(2)}`,
          comparing: [i, j],
          checked: Array.from({ length: i }, (_, idx) => idx),
          showLabels: true
        });

        if (dist < minDist) {
          minDist = dist;
          bestPair = [i, j];
          steps.push({
            type: 'update',
            message: `New minimum distance found: ${dist.toFixed(2)}`,
            comparing: [i, j],
            checked: Array.from({ length: i }, (_, idx) => idx),
            currentBest: true,
            showLabels: true
          });
        }
      }
    }

    steps.push({
      type: 'final',
      message: `Final result: Closest pair of points are ${bestPair[0]} and ${bestPair[1]} with distance ${minDist.toFixed(2)}`,
      comparing: bestPair,
      checked: Array.from({ length: pointsArray.length }, (_, idx) => idx),
      showLabels: true
    });

    setSteps(steps);
    setCurrentStep(0);
    setResult({ pair: bestPair, distance: minDist });
  };

  // Modified Divide and Conquer Implementation
  const generateDivideConquerSteps = (pointsArray) => {
    // First run brute force to store result for comparison
    const bruteForceSteps = [];
    let minDistBF = Infinity;
    let bestPairBF = null;

    for (let i = 0; i < pointsArray.length; i++) {
      for (let j = i + 1; j < pointsArray.length; j++) {
        const dist = distance(pointsArray[i], pointsArray[j]);
        if (dist < minDistBF) {
          minDistBF = dist;
          bestPairBF = [i, j];
        }
      }
    }
    setBruteForceResult({ distance: minDistBF, pair: bestPairBF });

    const steps = [];

    // Function to validate index for comparing
    const validateIndex = (idx, array) => {
      return idx >= 0 && idx < array.length ? idx : null;
    };

    // Function to create step objects with validated indices
    const createStep = (type, message, comparing = [], other = {}) => {
      const validComparing = comparing.map(idx => validateIndex(idx, points)).filter(idx => idx !== null);
      return {
        type,
        message,
        comparing: validComparing,
        ...other
      };
    };

    const closestPairDC = (pointSet) => {
      if (pointSet.length <= 3) {
        return bruteForceSubset(pointSet);
      }

      const pointsX = [...pointSet].sort((a, b) => a.x - b.x);
      const mid = Math.floor(pointSet.length / 2);
      const midX = pointsX[mid].x;

      // Create a 'divide' step and validate indices using createStep
      steps.push(createStep('divide', `Dividing points at x = ${midX}`, [], { divideX: midX, showLabels: true }));

      const leftSet = pointsX.slice(0, mid);
      const rightSet = pointsX.slice(mid);

      const leftResult = closestPairDC(leftSet);
      const rightResult = closestPairDC(rightSet);

      let minDist = Math.min(leftResult.distance, rightResult.distance);
      let bestPair = leftResult.distance < rightResult.distance ? leftResult.pair : rightResult.pair;

      const strip = pointsX.filter(p => Math.abs(p.x - midX) < minDist);
      strip.sort((a, b) => a.y - b.y);

      // Create a 'strip' step and validate indices using createStep
      steps.push(createStep('strip', `Checking strip of width ${(minDist * 2).toFixed(2)}`, bestPair, { strip: { x: midX - minDist, width: minDist * 2 }, showLabels: true }));

      for (let i = 0; i < strip.length; i++) {
        for (let j = i + 1; j < strip.length && (strip[j].y - strip[i].y) < minDist; j++) {
          const dist = distance(strip[i], strip[j]);
          const pi = points.findIndex(p => p.x === strip[i].x && p.y === strip[i].y);
          const pj = points.findIndex(p => p.x === strip[j].x && p.y === strip[j].y);

          // Create a 'compare' step and validate indices using createStep
          steps.push(createStep('compare', `Checking strip points ${pi} and ${pj}: Distance = ${dist.toFixed(2)}`, [pi, pj], { strip: { x: midX - minDist, width: minDist * 2 } }));

          if (dist < minDist) {
            minDist = dist;
            bestPair = [pi, pj];
            // Create an 'update' step and validate indices using createStep
            steps.push(createStep('update', `New minimum distance found: ${dist.toFixed(2)}`, [pi, pj], { strip: { x: midX - dist, width: dist * 2 } }));
          }
        }
      }

      return { distance: minDist, pair: bestPair };
    };

    const bruteForceSubset = (subset) => {
      let minDist = Infinity;
      let bestPair = null;

      for (let i = 0; i < subset.length; i++) {
        for (let j = i + 1; j < subset.length; j++) {
          const dist = distance(subset[i], subset[j]);
          const pi = points.findIndex(p => p.x === subset[i].x && p.y === subset[i].y);
          const pj = points.findIndex(p => p.x === subset[j].x && p.y === subset[j].y);

          // Create a 'brute' step and validate indices using createStep
          steps.push(createStep('brute', `Base case: Comparing points ${pi} and ${pj}: Distance = ${dist.toFixed(2)}`, [pi, pj]));

          if (dist < minDist) {
            minDist = dist;
            bestPair = [pi, pj];
          }
        }
      }

      return { distance: minDist, pair: bestPair };
    };

    const result = closestPairDC(pointsArray);
    steps.push(createStep('final', `Final result: Closest pair of points are ${result.pair[0]} and ${result.pair[1]} with distance ${result.distance.toFixed(2)}`, result.pair, { showLabels: true }));

    setSteps(steps);
    setCurrentStep(0);
    setResult(result);
  };

  // New brute force multiplication implementation
  const multiplyLargeIntegersBruteForce = (num1, num2) => {
    const steps = [];
    const n1 = num1.toString();
    const n2 = num2.toString();
    
    steps.push({
      type: 'start',
      message: `Starting traditional multiplication of ${num1} × ${num2}`,
      numbers: [num1, num2]
    });

    let finalResult = 0;
    let partialResults = [];

    for (let i = n2.length - 1; i >= 0; i--) {
      let carry = 0;
      let partial = '';
      const zeros = '0'.repeat(n2.length - 1 - i);
      
      steps.push({
        type: 'multiply_digit',
        message: `Multiplying ${num1} by ${n2[i]} (position ${n2.length - 1 - i})`,
        currentDigit: n2[i],
        position: i
      });

      for (let j = n1.length - 1; j >= 0; j--) {
        const product = (parseInt(n1[j]) * parseInt(n2[i])) + carry;
        carry = Math.floor(product / 10);
        partial = (product % 10) + partial;
        
        steps.push({
          type: 'partial_product',
          message: `${n1[j]} × ${n2[i]} + carry(${carry}) = ${product}`,
          partial: partial
        });
      }
      
      if (carry > 0) {
        partial = carry + partial;
      }
      partial = partial + zeros;
      partialResults.push(parseInt(partial));
      
      steps.push({
        type: 'partial_result',
        message: `Partial result for ${n2[i]}: ${partial}`,
        partial: partial,
        partialResults: [...partialResults]
      });
    }

    finalResult = partialResults.reduce((a, b) => a + b, 0);
    steps.push({
      type: 'final',
      message: `Final result: ${finalResult}`,
      result: finalResult,
      partialResults: partialResults
    });

    return { steps, result: finalResult };
  };


  // Modified file upload handlers
  const handlePointsFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const text = await file.text();
      const lines = text.trim().split('\n');
      const newOriginalPoints = lines.map(line => {
        const [x, y] = line.trim().split(/[,\s]+/).map(Number);
        return { x, y };
      });
      const newScaledPoints = newOriginalPoints.map(point => scalePoint(point));
      setOriginalPoints(newOriginalPoints);
      setPoints(newScaledPoints);
      generateBruteForceSteps(newScaledPoints);
      if (algorithm === 'divideconquer') {
        generateDivideConquerSteps(newScaledPoints);
      }
    } catch (err) {
      console.error('Error reading points file:', err);
    }
    e.target.value = '';
  };

  const handleMultiplicationFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
  
    try {
      // Read the content of the file
      const text = await file.text();
      
      // Split the content by line breaks, then trim any whitespace from the line
      const line = text.trim();
      
      // Split the line by space to extract the two numbers
      const numbers = line.split(' ').map(num => num.trim());
  
      // Check if there are exactly two numbers
      if (numbers.length === 2) {
        setNumbers({ num1: numbers[0], num2: numbers[1] });
      } else {
        console.warn('The file should contain exactly two numbers separated by a space.');
      }
    } catch (err) {
      console.error('Error reading multiplication file:', err);
    }
    
    // Reset the file input after processing
    e.target.value = '';
  };
  
  const splitNumber = (num, m) => {
    const str = num.toString();
    const high = parseInt(str.slice(0, -m) || '0');
    const low = parseInt(str.slice(-m) || '0');
    return [high, low];
  };

  const handleMultiplication = () => {
    // Input validation
    const num1 = numbers.num1.trim();
    const num2 = numbers.num2.trim();
    
    if (!num1 || !num2) {
      alert('Please enter both numbers');
      return;
    }
  
    if (!/^\d+$/.test(num1) || !/^\d+$/.test(num2)) {
      alert('Please enter valid positive integers');
      return;
    }
  
    // Clear previous steps and results
    setSteps([]);
    setCurrentStep(0);
    setResult(null);
  
    if (multAlgorithm === 'bruteforce') {
      const { steps: newSteps, result: finalResult } = multiplyLargeIntegersBruteForce(num1, num2);
      setSteps(newSteps);
      setResult(finalResult);
    } else {
      // For Karatsuba algorithm
      const result = { steps: [] };
      const finalResult = multiplyKaratsuba(BigInt(num1), BigInt(num2), result);
      setSteps(result.steps);
      setResult(finalResult.toString());
    }
  
    setCurrentStep(0);
    setIsPlaying(true);
  };

  // Modified Integer Multiplication with Animation
  const multiplyLargeIntegers = (num1, num2) => {
    const steps = [];
    
    const karatsuba = (x, y, depth = 0) => {
      const nx = x.toString();
      const ny = y.toString();
      
      steps.push({
        type: 'multiply',
        message: `Level ${depth}: Multiplying ${x} × ${y}`,
        numbers: [x, y],
        depth,
        animate: true
      });

      if (x < 10 || y < 10) {
        const result = x * y;
        steps.push({
          type: 'base',
          message: `Base case: ${x} × ${y} = ${result}`,
          numbers: [x, y],
          result,
          depth,
          animate: true
        });
        return result;
      }

      const m = Math.max(nx.length, ny.length);
      const m2 = Math.floor(m / 2);

      const [a, b] = splitNumber(x, m2);
      const [c, d] = splitNumber(y, m2);

      steps.push({
        type: 'split',
        message: `Split numbers: ${x} = ${a}×10^${m2} + ${b}, ${y} = ${c}×10^${m2} + ${d}`,
        numbers: [x, y],
        splits: [a, b, c, d],
        depth,
        animate: true
      });

      const ac = karatsuba(a, c, depth + 1);
      const bd = karatsuba(b, d, depth + 1);
      const abcd = karatsuba(a + b, c + d, depth + 1);
      const adbc = abcd - ac - bd;

      const result = ac * Math.pow(10, 2 * m2) + adbc * Math.pow(10, m2) + bd;

      steps.push({
        type: 'combine',
        message: `Combine: ${result} = ${ac}×10^${2*m2} + ${adbc}×10^${m2} + ${bd}`,
        numbers: [x, y],
        result,
        depth,
        animate: true
      });

      return result;
    };

    const result = karatsuba(parseInt(num1), parseInt(num2));
    setSteps(steps);
    setCurrentStep(0);
    setResult(result);
  };

   const multiplyKaratsuba = (x, y, result = { steps: [] }, depth = 0) => {
    const nx = x.toString();
    const ny = y.toString();
    
    result.steps.push({
      type: 'multiply',
      message: `Level ${depth}: Multiplying ${nx} × ${ny}`,
      numbers: [nx, ny],
      depth
    });

    if (x < 10n || y < 10n) {
      const product = x * y;
      result.steps.push({
        type: 'base',
        message: `Base case: ${nx} × ${ny} = ${product.toString()}`,
        numbers: [nx, ny],
        result: product.toString(),
        depth
      });
      return product;
    }

    const m = BigInt(Math.floor(Math.max(nx.length, ny.length) / 2));
    const base = 10n ** m;

    const a = x / base;
    const b = x % base;
    const c = y / base;
    const d = y % base;

    result.steps.push({
      type: 'split',
      message: `Split: ${nx} = ${a}×10^${m} + ${b}, ${ny} = ${c}×10^${m} + ${d}`,
      splits: { a: a.toString(), b: b.toString(), c: c.toString(), d: d.toString(), m: m.toString() },
      depth
    });

    const ac = multiplyKaratsuba(a, c, result, depth + 1);
    const bd = multiplyKaratsuba(b, d, result, depth + 1);
    const abcd = multiplyKaratsuba(a + b, c + d, result, depth + 1);
    const adbc = abcd - ac - bd;

    result.steps.push({
      type: 'intermediate',
      message: `Level ${depth} intermediate: ac=${ac}, bd=${bd}, (a+b)(c+d)=${abcd}, ad+bc=${adbc}`,
      values: { ac: ac.toString(), bd: bd.toString(), abcd: abcd.toString(), adbc: adbc.toString() },
      depth
    });

    const finalResult = (ac * base * base) + (adbc * base) + bd;

    result.steps.push({
      type: 'combine',
      message: `Level ${depth} result: ${finalResult} = ${ac}×10^${m*2n} + ${adbc}×10^${m} + ${bd}`,
      result: finalResult.toString(),
      depth
    });

    return finalResult;
  };

  // Animation Effect
  useEffect(() => {
    let interval;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentStep(prev => {
          if (prev >= steps.length - 1) {
            if (activeTab === "multiplication" && multiplicationPairs.length > 0) {
              const currentPairIndex = Math.floor(prev / steps.length);
              if (currentPairIndex < multiplicationPairs.length - 1) {
                const nextPair = multiplicationPairs[currentPairIndex + 1];
                setNumbers({ num1: nextPair[0], num2: nextPair[1] });
                multiplyLargeIntegers(nextPair[0], nextPair[1]);
                return 0;
              }
            }
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, animationSpeed);
    }
    return () => clearInterval(interval);
  }, [isPlaying, steps.length, animationSpeed, activeTab, multiplicationPairs]);

  return (
    <ThemeProvider theme={theme}>
    <Card className="w-[90vw] mx-auto mt-4">
      <CardContent>
        <Tabs
          value={activeTab}
          onChange={(_, value) => {
            setActiveTab(value);
            setSteps([]);
            setCurrentStep(0);
            setResult(null);
            setZoom(1);
          }}
          className="mb-6"
        >
          <Tab label="Closest Pair of Points" value="closestPair" />
          <Tab label="Integer Multiplication" value="multiplication" />
        </Tabs>
  
        {activeTab === "closestPair" && (
          <Box className="space-y-4">
            <Box className="flex flex-wrap gap-4 mb-4">
              <Select
                value={algorithm}
                onChange={(e) => {
                  setAlgorithm(e.target.value);
                  if (points.length > 0) {
                    if (e.target.value === 'bruteforce') {
                      generateBruteForceSteps(points);
                    } else {
                      generateDivideConquerSteps(points);
                    }
                  }
                }}
                className="w-full sm:w-[180px]"
              >
                <MenuItem value="bruteforce">Brute Force</MenuItem>
                <MenuItem value="divideconquer">Divide & Conquer</MenuItem>
              </Select>
  
              <Button
                variant="outlined"
                onClick={() => fileInputRef.current.click()}
                startIcon={<Upload />}
                className="w-full sm:w-auto"
              >
                Upload Points
              </Button>
  
              <Button
                variant="outlined"
                onClick={generatePoints}
                startIcon={<Shuffle />}
                className="w-full sm:w-auto"
              >
                Random Points
              </Button>
  
              <Box className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <Button
                  variant="outlined"
                  onClick={() => setZoom(prev => Math.max(0.5, prev - 0.5))}
                  startIcon={<ZoomIn />}
                  className="w-full sm:w-auto"
                >
                  Zoom In
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => setZoom(prev => Math.min(3, prev + 0.5))}
                  startIcon={<ZoomOut />}
                  className="w-full sm:w-auto"
                >
                  Zoom Out
                </Button>
              </Box>
  
              <FormControlLabel
                control={
                  <Switch
                    checked={showLabels}
                    onChange={(e) => setShowLabels(e.target.checked)}
                  />
                }
                label="Show Labels"
                className="w-full sm:w-auto"
              />
  
              <input
                type="file"
                ref={fileInputRef}
                onChange={handlePointsFileUpload}
                className="hidden"
                accept=".txt,.csv"
              />
            </Box>
  
            <Box
              className="relative h-[500px] border rounded-lg overflow-hidden cursor-move"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              <svg
                ref={svgRef}
                viewBox={getViewBox()}
                className="w-full h-full"
                style={{
                  transform: `translate(${pan.x}px, ${pan.y}px)`,
                  transition: isDragging ? 'none' : 'transform 0.1s'
                }}
              >
                {steps[currentStep]?.strip && (
                  <rect
                    x={steps[currentStep].strip.x}
                    y="0"
                    width={steps[currentStep].strip.width}
                    height="300"
                    className="fill-blue-100 stroke-blue-500"
                    strokeDasharray="4"
                  />
                )}
  
                {steps[currentStep]?.divideX && (
                  <line
                    x1={steps[currentStep].divideX}
                    y1="0"
                    x2={steps[currentStep].divideX}
                    y2="300"
                    className="stroke-gray-400"
                    strokeWidth="1"
                    strokeDasharray="4"
                  />
                )}
              {points.map((point, idx) => (
                <g key={idx} className="group">
                  {/* Point Circle with border */}
                  <circle
                    cx={point.x}
                    cy={point.y}
                    r="5"
                    fill="#8963f4"
                    stroke="black"  // Set the border color
                    strokeWidth="2"  // Set the border thickness
                    className="cursor-pointer"  // Always visible
                  />

                    {/* Point Label */}
                    {showLabels ? (
                      // Show all labels if showLabels is true
                      <text
                        x={point.x + 10}
                        y={point.y - 10}
                        className="fill-gray-700 transition-opacity duration-300"
                        style={{
                          fontSize: `${5 * zoom}px`,  // Dynamic font size based on zoom
                        }}
                      >
                        Point {idx} ({point.originalX}, {point.originalY})
                      </text>
                    ) : (
                      // Show label only on hover if showLabels is false
                      <text
                        x={point.x + 10}
                        y={point.y - 10}
                        className="fill-gray-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300 group-hover:block hidden"
                        style={{
                          fontSize: `${7 * zoom}px`,  // Dynamic font size based on zoom
                        }}
                      >
                        Point {idx} ({point.originalX}, {point.originalY})
                      </text>
                    )}
                  </g>
                ))}

  
                {steps[currentStep]?.comparing?.length === 2 && (
                  <line
                    x1={points[steps[currentStep].comparing[0]]?.x}
                    y1={points[steps[currentStep].comparing[0]]?.y}
                    x2={points[steps[currentStep].comparing[1]]?.x}
                    y2={points[steps[currentStep].comparing[1]]?.y}
                    className="stroke-red-500"
                    strokeWidth="2"
                    strokeDasharray="5,5"
                  />
                )}
              </svg>
  
              {steps[currentStep]?.message && (
                <Typography
                  variant="body2"
                  className="absolute top-2 left-2 bg-white/80 p-2 rounded"
                >
                  {steps[currentStep].message}
                </Typography>
              )}
  
              {algorithm === 'divideconquer' && bruteForceResult && (
                <Typography
                  variant="body2"
                  className="absolute bottom-2 right-2 bg-white/80 p-2 rounded"
                >
                  Brute Force Result: Distance = {bruteForceResult.distance.toFixed(2)}
                </Typography>
              )}
            </Box>
  
            {/* Existing control buttons remain the same */}
            <Box className="flex flex-wrap justify-between mt-6 gap-2">
              <Button
                onClick={() => setCurrentStep(prev => Math.max(0, prev - 1))}
                disabled={currentStep === 0}
                startIcon={<SkipPrevious />}
                variant="outlined"
                className="w-full sm:w-auto"
              >
                Previous Step
              </Button>
  
              <Box className="flex gap-2 w-full sm:w-auto">
                <Button
                  onClick={() => setIsPlaying(!isPlaying)}
                  startIcon={isPlaying ? <Pause /> : <PlayArrow />}
                  variant="outlined"
                  className="w-full sm:w-auto"
                >
                  {isPlaying ? 'Pause' : 'Play'}
                </Button>
  
                <Button
                  onClick={() => setCurrentStep(steps.length - 1)}
                  disabled={currentStep === steps.length - 1}
                  startIcon={<ArrowForward />}
                  variant="outlined"
                  className="w-full sm:w-auto"
                >
                  Next Step
                </Button>
              </Box>
            </Box>
          </Box>
        )}
  
        {activeTab === "multiplication" && (
          <Box className="space-y-4">
            <Box className="flex flex-wrap gap-4 items-center w-full">
              <Select
                value={multAlgorithm}
                onChange={(e) => setMultAlgorithm(e.target.value)}
                className="w-full sm:w-[180px]"
              >
                <MenuItem value="bruteforce">Traditional Method</MenuItem>
                <MenuItem value="divideconquer">Karatsuba Algorithm</MenuItem>
              </Select>
              <TextField
                value={numbers.num1}
                onChange={(e) => setNumbers(prev => ({ ...prev, num1: e.target.value }))}
                placeholder="Enter first number"
                className="w-full sm:w-[200px]"
              />
              <TextField
                value={numbers.num2}
                onChange={(e) => setNumbers(prev => ({ ...prev, num2: e.target.value }))}
                placeholder="Enter second number"
                className="w-full sm:w-[200px]"
              />
              <Button
                variant="outlined"
                onClick={() => multiplicationFileRef.current.click()}
                startIcon={<Upload />}
                className="w-full sm:w-auto"
              >
                Upload Numbers
              </Button>
              <input
                type="file"
                ref={multiplicationFileRef}
                onChange={handleMultiplicationFileUpload}
                className="hidden"
                accept=".txt"
              />
            </Box>
  
            <Button
              onClick={handleMultiplication}
              variant="contained"
              fullWidth
            >
              Multiply
            </Button>
  
            {steps.length > 0 && (
              <Box className="space-y-2 max-h-[400px] overflow-y-auto">
                {steps.map((step, index) => (
                  <Box
                    key={index}
                    className={`border-b py-2 ${currentStep === index ? 'bg-blue-50' : ''}`}
                  >
                    {step.type === 'header' ? (
                      <Typography variant="h6" className="font-bold text-blue-600">
                        {step.message}
                      </Typography>
                    ) : (
                      <>
                        <Typography variant="body1" className="font-semibold">
                          {step.message}
                        </Typography>
                        {step.partial && (
                          <Typography variant="body2" className="font-mono">
                            Partial: {step.partial}
                          </Typography>
                        )}
                        {step.partialResults && (
                          <Typography variant="body2" className="font-mono">
                            Running total: {step.partialResults.join(' + ')}
                          </Typography>
                        )}
                        {step.result !== undefined && (
                          <Typography variant="body1" className="font-bold text-green-600">
                            Result: {step.result}
                          </Typography>
                        )}
                      </>
                    )}
                  </Box>
                ))}
              </Box>
            )}
          </Box>
        )}
      </CardContent>
    </Card>
    </ThemeProvider>
  );  
};

export default VisualizerComponent;