# Algorithm Visualizer

## Overview

The **Algorithm Visualizer** allows users to visually explore algorithms like **Integer Multiplication** and the **Closest Pair of Points** problem. It dynamically displays each step of the algorithm to help users understand the underlying logic and process.

### Algorithms Supported:

1. **Integer Multiplication**  
   - Visualize the process of multiplying large integers using various algorithms.
   - **Expected input format**:  
     Each file should contain two integers separated by a space in one line.  
     Example:
     ```
     123456 789012
     ```
   - This input will be processed and visualized step by step in the multiplication process.

2. **Closest Pair of Points**  
   - Visualize the algorithm for finding the closest pair of points in a 2D plane using a divide and conquer approach.
   - **Expected input format**:  
     Each line of file should contain two space-separated values representing the x and y coordinates of a point.  
     Example:
     ```
     1 2
     3 4
     5 6
     7 8
     ```
   - These points will be used to find the closest pair of points and the steps involved in the algorithm will be visualized.

## Features

- Interactive visualizations of the closest pair of points and integer multiplication algorithms.
- Step-by-step animation showing how the algorithm works in real time.
- Adjustable zoom and pan for better visual analysis.
- Ability to upload custom input files or generate random input files using a Python script.



## Project Structure

```plaintext
algorithm-visualizer/
├── generateTestFiles.py                # Python script to generate random test input files
├── generated_test_files/               # Folder containing generated test input files
│   └── sample_test_case.txt            # Example generated input file (can vary by algorithm)
├── algorithm-visualizer/               # React Vite app folder (frontend)
│   ├── public/                         # Public static files (index.html, favicon, etc.)
│   ├── src/                            # React source code
│   │   ├── assets/                     # Folder for images, icons, GIFs
│   │   ├── components/                 # React components like VisualizerComponent
|   |   |── pages/                      # React pages
│   │   ├── main.jsx                    # Entry point for React app (Vite's main entry)
│   │   └── ...                         # Other React-specific files
│   ├── package.json                    # Project dependencies and scripts
│   ├── package-lock.json               # Exact versions of dependencies (auto-generated)
│   ├── vite.config.js                  # Vite configuration file
│   └── README.md                       # ReadMe file with project instructions (this file)
├── .gitignore                          # Git ignore file to exclude node_modules, etc.
├── LICENSE                             # License file (if applicable)
└── README.md                           # Project's ReadMe file with overview, instructions, etc.
```


## Installation

To set up and run the project locally, follow these steps:

### 1. Clone the repository

Clone the repository to your local machine using Git:

```bash
git clone https://github.com/sunnyallana/algorithm-visualizer.git
cd algorithm-visualizer
```

### 2. Install dependencies for the React frontend

Navigate to the `algorithm-visualizer` folder and install the required npm packages:

```bash
cd algorithm-visualizer
npm install
```

### 3. Run the Python script to generate random test files

The project includes a Python script `generateTestFiles.py` located in the root directory. This script generates random test files that can be used as input for the visualizer.

1. Ensure you have **Python 3** installed on your machine.
2. Run the following command in your terminal from the root directory of the project:

```bash
python3 generateTestFiles.py
```

This will generate a folder called generated_test_files/ containing random input files.

### 4. Run the React Application Locally

To start the frontend React application locally

```bash
npm run dev
```

This will start the Vite development server. You can access the app at: http://localhost:3000

### Some Screenshots
![display_0](https://github.com/user-attachments/assets/584f6931-eec6-4d17-9f10-9c8f0a3fd381)
![display_1](https://github.com/user-attachments/assets/38402573-4ba4-40f3-be35-9bfe364ba13d)
![display_2](https://github.com/user-attachments/assets/0281681d-65df-4723-a3ca-af53167322dd)
