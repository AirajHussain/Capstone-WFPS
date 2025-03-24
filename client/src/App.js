import React from 'react';
import './App.css';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Reports from './pages/Reports';
import Tables from './pages/Tables';
import MapView from './pages/MapView';
import About from './pages/About';
import {BrowserRouter as Router, Routes, Route, Link, Switch } from "react-router-dom";


function App() {
  return (
    
    <Router>
      <div className= "application">
  
        <Switch>
          <Route path='/'exact component={Home}/>
          <Route path ='/Reports' component ={Reports}/>
          <Route path = '/Tables' component = {Tables}/>
          <Route path = '/MapView' component = {MapView}/>
          <Route path = '/About' component = {About}/>
        </Switch>

      </div>
    </Router>

  );
}

export default App;
