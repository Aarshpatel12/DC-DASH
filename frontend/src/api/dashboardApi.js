import axios from "axios";
const BASE_URL = "http://localhost:3000/api/dashboard";

export const getMonthlyBudget = (year) => 
    axios.get(`${BASE_URL}/monthly-budget/${year}`,{
        withCredentials:true
    });


export const getYearComparison = () => 
    axios.get(`${BASE_URL}/year-comparison`, {
        withCredentials:true
    });

export const getTopDepartments = (year) => 
    axios.get(`${BASE_URL}/top-departments/${year}`,
       { withCredentials:true}
    );

