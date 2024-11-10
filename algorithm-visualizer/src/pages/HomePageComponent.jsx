import React from 'react';
import { motion } from 'framer-motion';
import { LayoutGrid, Binary, GitGraph } from 'lucide-react';
import VisualizerComponent from '../components/VisualizerComponent';
import { Link } from 'react-scroll';

const HomePage = () => {
  const containerAnimation = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.3,
      },
    },
  };

  const itemAnimation = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      {/* Hero Section */}
      <section className="min-h-screen flex flex-col justify-center items-center p-4 md:p-8">
        <motion.div
          initial="hidden"
          animate="show"
          variants={containerAnimation}
          className="max-w-4xl mx-auto text-center"
        >
          <motion.div variants={itemAnimation} className="mb-8">
            <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-blue-500 to-purple-500 text-transparent bg-clip-text">
              Algorithm Visualizer
            </h1>
            <p className="text-xl text-gray-400">
              Interactive visualization of complex algorithms
            </p>
          </motion.div>

          <motion.div
            variants={itemAnimation}
            className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-16"
          >
            <div className="p-6 rounded-lg bg-gray-800 hover:bg-gray-750 transition-all">
              <Binary className="w-12 h-12 mb-4 text-blue-500 mx-auto" />
              <h3 className="text-xl font-semibold mb-2">Integer Multiplication</h3>
              <p className="text-gray-400">
                Visualize the process of multiplying large integers using various algorithms
              </p>
            </div>

            <div className="p-6 rounded-lg bg-gray-800 hover:bg-gray-750 transition-all">
              <GitGraph className="w-12 h-12 mb-4 text-purple-500 mx-auto" />
              <h3 className="text-xl font-semibold mb-2">Closest Pair of Points</h3>
              <p className="text-gray-400">
                See how the algorithm finds the closest pair of points in a 2D plane
              </p>
            </div>
          </motion.div>

          {/* Horizontal alignment of buttons */}
          <motion.div variants={itemAnimation} className="mt-12 flex justify-center space-x-6">
            {/* Link component to scroll to the Visualizer section */}
            <Link
              to="visualize" // Target ID of the section to scroll to
              smooth={true}   // Enable smooth scrolling
              duration={500}  // Duration of the scroll
              className="px-8 py-3 bg-blue-600 hover:bg-blue-700 rounded-full font-semibold transition-all cursor-pointer"
            >
              Start Visualizing
            </Link>

            {/* New Button to View GitHub Repo */}
            <a
              href="https://github.com/sunnyallana/algorithm-visualizer"
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-3 bg-purple-600 hover:bg-purple-700 rounded-full font-semibold transition-all cursor-pointer"
            >
              View GitHub Repo
            </a>
          </motion.div>
        </motion.div>
      </section>

      {/* Visualization Section */}
      <section id="visualize" className="min-h-screen bg-gray-850 p-8 flex flex-col justify-center items-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-6xl mx-auto"
        >
          <h2 className="text-4xl font-bold mb-8 text-center text-gray-100">
            Visualizations
          </h2>
          <VisualizerComponent />
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 py-6 text-center">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-gray-400"
        >
          Designed & Developed by{' '}
          <a
            href="https://www.linkedin.com/in/sunnyallana"
            target="_blank"
            rel="noopener noreferrer"
            className="text-purple-500 hover:text-purple-700 font-semibold"
          >
            Sunny Shaban Ali
          </a>
        </motion.p>
      </footer>
    </div>
  );
};

export default HomePage;