import { useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from './Icon.jsx';
import AccountModal from './AccountModal.jsx';
import useGoogleAccount from './useGoogleAccount.js';
import { WA_LINK_DEFAULT } from './siteConfig.js';
import './BottomNav.css';

export default function BottomNav() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState('projects'); // 'projects' | 'profile' — just varies the modal copy
  const { user, handleCredential, signOut } = useGoogleAccount();

  function openModal(which) {
    setTab(which);
    setOpen(true);
  }

  return (
    <>
      <nav className="bn-bar" aria-label="Portal navigation">
        <Link to="/" className="bn-item" onClick={() => setOpen(false)}>
          <Icon name="home" size={21} />
          <span>Home</span>
        </Link>
        <button type="button" className="bn-item" onClick={() => openModal('projects')}>
          <Icon name="folder" size={21} />
          <span>My Projects</span>
        </button>
        <button type="button" className="bn-item" onClick={() => openModal('profile')}>
          {user?.picture
            ? <img src={user.picture} alt="" className="bn-avatar" referrerPolicy="no-referrer" />
            : <Icon name="user" size={21} />}
          <span>Profile</span>
        </button>
        <a href={WA_LINK_DEFAULT} target="_blank" rel="noopener noreferrer" className="bn-item bn-item-wa">
          <Icon name="whatsapp" size={20} />
          <span>WhatsApp</span>
        </a>
      </nav>

      <AccountModal
        open={open}
        tab={tab}
        onClose={() => setOpen(false)}
        user={user}
        onCredential={handleCredential}
        onSignOut={signOut}
      />
    </>
  );
}
