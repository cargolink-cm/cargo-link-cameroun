import React, { useState } from 'react';
import './App.css';
import Connexion from './pages/Connexion';
import Dashboard from './pages/Dashboard';
import Inscription from './pages/Inscription';
import Transporteur from './pages/Transporteur';
function App() {
  const [user, setUser] = useState(null);
  const [page, setPage] = useState('accueil');

  if (page === 'connexion') {
  return <Connexion onConnexion={(u) => { setUser(u); setPage('dashboard'); }} />;
}
if (page === 'inscription') {
return <Inscription onInscription={(u) => { setUser(u); setPage('dashboard'); }} />;
}
if (page ==='transporteur-inscription') {
  return <Inscription onInscription={(u) => {setUser(u); setPage('transporteur'); }} />
}
if (page === 'dashboard') {
  return <Dashboard user={user} />;
}
if (page === 'transporteur') {
  return <Transporteur user={user} />;
}
  return (
    <div className="app">
      <header className="header">
        <h1>Cargolink Cameroun</h1>
        <p>Trouvez un camion en 5 minutes</p>
        </header>
        <main className="main">
          <div className="hero">
            <h2>Connectez chargeurs et transporteurs</h2>
            <div className="buttons">
              <button className="btn-chargeur" onClick={() => setPage('inscription')}>Je suis chargeur</button>
              <button className="btn-transporteur" onClick={() => setPage('transporteur-inscription')}>Je suis transporteur</button>
              <button onClick={() => setPage('connexion')}>Deja inscrit ? Se connecter</button>
              </div>
              </div>
              </main>
              </div>
  );
}

export default App;