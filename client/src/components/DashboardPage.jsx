function DashboardPage({ user, handleLogout }) {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Welcome, {user.firstname}</h1>
        <button onClick={handleLogout}>Logout</button>
      </header>
    </div>
  );
}

export default DashboardPage;
