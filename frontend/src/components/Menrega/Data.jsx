import React, { useState, useEffect } from "react";

const Data = () => {
  const [data, setData] = useState([]);

  useEffect(() => {
    fetch("http://localhost:3000/api/data")
      .then((res) => res.json())
      .then((json) => setData(json))
      .catch((err) => console.error(err));
  }, []);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">MGNREGA Dataset</h1>
      <table className="min-w-full bg-white border border-gray-300">
        <thead>
          <tr className="bg-blue-800 text-white">
            <th className="px-4 py-2">Block</th>
            <th className="px-4 py-2">Opening_balance</th>
            <th className="px-4 py-2">Current Year Fund</th>
            <th className="px-4 py-2">
              EFMS fund
            </th>
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => (
            <tr key={index} className="text-center border-t">
              <td className="px-4 py-2">{item.block_name}</td>
              <td className="px-4 py-2">{item.opening_balance}</td>
              <td className="px-4 py-2">{item.current_year_fund}</td>
              <td className="px-4 py-2">{item.efms_fund}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Data;
