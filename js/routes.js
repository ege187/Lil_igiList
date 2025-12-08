[
import List from './pages/List.js';
import Leaderboard from './pages/Leaderboard.js';
import Roulette from './pages/Roulette.js';
import DemonListPage from './pages/demonlist.js';
import Leaderboard2 from './pages/Leaderboard2.js';

export default [
    { path: '/', component: List },
    { path: '/leaderboard', component: Leaderboard },
    { path: '/leaderboard2', component: Leaderboard2 },
    { path: '/roulette', component: Roulette },
    { path: '/demonlist', component: DemonListPage },
];
