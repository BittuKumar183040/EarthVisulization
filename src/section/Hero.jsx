import React, { useState } from 'react';
import Renderer from './Renderer';
import coverage_data from '../data/coverage.json';
import sat_data from '../data/satellites.json';

const Hero = () => {
  const parameters = [
    { satellites: sat_data.length, targets: coverage_data.length },
  ];

  const [selectedCoverage, setSelectedCoverage] = useState(coverage_data[0]);

  return (
    <div className=" relative h-screen w-screen dark:text-white">
      <div className=" absolute z-50 left-3 top-20 text-xs p-1 bg-white bg-opacity-80 backdrop-blur-sm shadow-md rounded-lg max-w-xs mx-auto">
        <table className="min-w-full table-auto">
          <tbody>
            {parameters.map((row, index) => (
              <tr key={index} className="border-b">
                <td className="px-4 py-2">No. of Satellites</td>
                <td className="px-4 py-2 text-center">{row.satellites}</td>
              </tr>
            ))}
            {parameters.map((row, index) => (
              <tr key={index}>
                <td className="px-4 py-2">No. of Targets</td>
                <td className="px-4 py-2 text-center">{row.targets}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ backgroundImage: "url(./stars.jpg)" }}
        className=" absolute h-full w-full bg-cover bg-no-repeat bg-center bg-fixed"
      >
        <div className="absolute h-full w-full backdrop-blur-sm bg-black/10"></div>
        <Renderer
          parameters={parameters}
          coverage_data={coverage_data}
          selectedCoverage={selectedCoverage}
        />
      </div>
    </div>
  );
};

export default Hero;
