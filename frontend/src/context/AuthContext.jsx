import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import api from '../services/api';
const AuthContext = createContext(null);
export function AuthProvider({
  children
}) {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('doptech_user'));
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    const fn = () => setUser(null);
    window.addEventListener('doptech:logout', fn);
    return () => window.removeEventListener('doptech:logout', fn);
  }, []);
  const login = async (email, password) => {
    setLoading(true);
    try {
      const {
        data
      } = await api.post('/auth/login', {
        email,
        password
      });
      localStorage.setItem('doptech_token', data.data.token);
      localStorage.setItem('doptech_user', JSON.stringify(data.data.user));
      setUser(data.data.user);
      return data.data.user;
    } finally {
      setLoading(false);
    }
  };
  const register = async payload => api.post('/auth/register', payload);
  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (_) {} finally {
      localStorage.removeItem('doptech_token');
      localStorage.removeItem('doptech_user');
      sessionStorage.removeItem('doptech_checkout_key');
      setUser(null);
    }
  };
  const value = useMemo(() => ({
    user,
    loading,
    login,
    register,
    logout,
    isCustomer: user?.role === 'CUSTOMER',
    isAdmin: user?.role === 'ADMIN',
    isStaff: user?.role === 'STAFF'
  }), [user, loading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export const useAuth = () => useContext(AuthContext);

// ===== MA CU TRUOC KHI SUA - CHI GIU DE DOI CHIEU, KHONG THUC THI =====
// import {createContext,useContext,useEffect,useMemo,useState} from 'react';import api from '../services/api';
// const AuthContext=createContext(null);
// export function AuthProvider({children}){const [user,setUser]=useState(()=>{try{return JSON.parse(localStorage.getItem('doptech_user'))}catch{return null}});const [loading,setLoading]=useState(false);
//  useEffect(()=>{const fn=()=>setUser(null);window.addEventListener('doptech:logout',fn);return()=>window.removeEventListener('doptech:logout',fn)},[]);
//  const login=async(email,password)=>{setLoading(true);try{const {data}=await api.post('/auth/login',{email,password});localStorage.setItem('doptech_token',data.data.token);localStorage.setItem('doptech_user',JSON.stringify(data.data.user));setUser(data.data.user);return data.data.user}finally{setLoading(false)}};
//  const register=async(payload)=>api.post('/auth/register',payload);const logout=()=>{localStorage.removeItem('doptech_token');localStorage.removeItem('doptech_user');setUser(null)};
//  const value=useMemo(()=>({user,loading,login,register,logout,isCustomer:user?.role==='CUSTOMER',isAdmin:user?.role==='ADMIN',isStaff:user?.role==='STAFF'}),[user,loading]);return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>}
// export const useAuth=()=>useContext(AuthContext);
// 
// ===== HET MA CU =====
