import React, { useState } from 'react';
import Renderer from './Renderer';
import coverage_data from '../data/coverage.json';
import sat_data from '../data/satellites.json';

const Hero = () => {
  const parameters = [{ satellites: sat_data.length, targets: coverage_data.length }];

  const [selectedCoverage, setSelectedCoverage] = useState(coverage_data[0]);

  return (
    <div className=" dark:text-white">
      <div className=" text-xs p-1 bg-white shadow-md rounded-lg max-w-xs mx-auto">
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
      <div className=" h-screen bg-transparent">
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
