import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import Navbar from './components/Layout/Navbar';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import DuelPage from './pages/DuelPage';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import FriendsPage from './pages/FriendsPage';
import DuelsPage from './pages/DuelsPage';
import ProfilePage from './pages/ProfilePage';
import BattlePage from './pages/BattlePage';

const App = () => {
  return (
    <Router>
      <div className="app">
        <Navbar />
        <main className="main-content">
          <Switch>
            <Route path="/" exact component={Home} />
            <Route path="/login" component={Login} />
            <Route path="/register" component={Register} />
            <Route path="/dashboard" component={Dashboard} />
            <Route path="/battle/:duelId" component={BattlePage} />
            <Route path="/duel/:duelId" component={DuelPage} />
            <Route path="/friends" component={FriendsPage} />
            <Route path="/duels" component={DuelsPage} />
            <Route path="/sync" component={ProfilePage} />
          </Switch>
        </main>
      </div>
    </Router>
  );
};

export default App;