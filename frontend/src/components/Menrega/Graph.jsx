// import React from 'react'
import React, {useEffect, useState} from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,ResponsiveContainer } from 'recharts';

function Graph() {
    const [data, setData] = useState([]);

    useEffect(() => {
        fetch("http://localhost:3000/api/data")
        .then(res=> res.json())
        .then(json => setData(json))
        .catch(err => console.error(err));
    }, [])
  return (
    <div className='p-4'>
        <div className="max-w-3xl mx-auto bg-white shadow-lg rounded-xl p-6">
        <h1 className='text-2xl font-bold mb-4 text-center'>MNREGA Fund Chart</h1>
        <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data} margin={{top:20, right:30, left:0, bottom:5}}>
                <CartesianGrid strokeDasharray="3 3"/>
                <XAxis dataKey = "block_name" label={{
                    value:"Block Name",
                    offset:-5,
                    position:"insideBottom"

                }}/>
                <YAxis label={{
                    value:"Total Fund Available(₹)",
                    angle:-90,
                    position:"insideLeft"

                }}/>
                <Tooltip/>
                <Legend/>
                <Bar dataKey="total_fund_available" fill ="#3B82f6"/>
            </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
//wfgvwiyfvweiyfvbyeiri
export default Graph
