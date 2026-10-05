/**
 * WAVELVADI (वावेलवाडी) VILLAGE WEBSITE INTERACTIVE CONTROLLER
 * Features: Language Switching, ADMIN Dashboard, Creator Approval,
 * Like/Dislike/Download, YouTube Links, Google Drive Cloud Storage, Mobile Responsive
 */

'use strict';

let currentLanguage = 'mr';
let currentUser = { logged_in: false, role: 'public', username: '', is_admin: false };
let currentActiveCategory = 'all';
let allPublishedContent = [];

// ==========================================
// TRANSLATIONS
// ==========================================
const translations = {
  mr: {
    heroTag: '• सह्याद्रीचा अभिमान •',
    heroTitle: 'Welcome to <span class="highlight">Wavelvadi Village</span>',
    heroDesc: 'सह्याद्रीच्या डोंगररांगांमध्ये वसलेले, निसर्गरम्य वातावरण, समृद्ध वारसा, सेंद्रिय शेती आणि एकोप्याची परंपरा जपणारे आणि महिलांचा सन्मान करणारा आदर्श महासंस्कृती गाव वावेलवाडी.',
    btnExplore: 'गाव भ्रमंती करा',
    btnCreatorReq: 'क्रिएटर बना (परवानगी अर्ज)',
    statPop: '१५०+', statPopLabel: 'ग्रामस्थ लोकसंख्या',
    statArea: '१,२०० हेक्टर', statAreaLabel: 'निसर्गरम्य परिसर',
    statHeritage: '३००+ वर्षे', statHeritageLabel: 'ऐतिहासिक परंपरा',
    historyTag: 'इतिहास आणि वारसा',
    historyTitle: 'वावेलवाडीचा इतिहास',
    historyDesc: 'सह्याद्रीच्या कुशीत ३०० हून अधिक वर्षांपासून वसलेल्या वावेलवाडी गावाला ऐतिहासिक बारव विहिरी, पराक्रमी पूर्वज आणि जलव्यवस्थापनाचा गौरवशाली वारसा लाभला आहे.',
    cultureTag: 'संस्कृती आणि वारसा', cultureTitle: 'वावेलवाडीची समृद्ध परंपरा',
    cultureDesc: 'पिढ्यानपिढ्या जपलेली शिमगा उत्सव, श्री राधाकृष्ण पालखी उत्सव, श्री गणेश चतुर्थी उत्सव, नवरात्रोत्सव आणि दीपावली.',
    vlogTag: 'ग्राम कथा व व्लॉग', vlogTitle: 'वावेलवाडीतील जीवन व व्लॉग',
    vlogDesc: 'आमच्या स्थानिक क्रिएटर मंडळींनी टिपलेले गावचे निसर्गरम्य व्हिडिओ आणि गोष्टी.',
    galleryTag: 'छायाचित्र दालन', galleryTitle: 'वावेलवाडी मीडिया गॅलरी',
    noticeTag: 'जाहीर बातमीपत्र', noticeTitle: 'ग्रामपंचायत सूचना फलक',
    devTag: 'Instagram', devTitle: 'वावेलवाडी प्रगती',
    devDesc: 'गावातील सण, संस्कृती, निसर्ग, दैनिक व्लॉग आणि विकास प्रकल्पांचे रील्स पाहण्यासाठी आमचे इंस्टाग्राम पेज फॉलो करा.',
    devBadge: '📸 Official Instagram',
    devNotice: 'वावेलवाडीचे अधिकृत इंस्टाग्राम पेज फॉलो करा व विकासकामांशी जोडलेले रहा!',
    creatorTag: 'आमचे योगदानकर्ते', creatorTitle: 'वावेलवाडी लेखक व क्रिएटर',
    creatorDesc: 'ADMIN कडून मंजूर मिळालेले आणि गावाची माहिती समृद्ध करणारे अधिकृत क्रिएटर.',
    navHome: 'मुख्य पृष्ठ', navHistory: 'इतिहास', navCulture: 'संस्कृती',
    navVlogs: 'व्लॉग', navGallery: 'गॅलरी', navNotices: 'सूचना', navDev: 'विकास',
    navLogin: 'प्रवेश (Login)',
    modalReqTitle: 'वावेलवाडी क्रिएटर नोंदणी अर्ज',
    modalReqDesc: 'गावाची संस्कृती, व्लॉग, फोटो अथवा बातमी प्रसिद्ध करण्यासाठी ADMIN कडून परवानगी मिळवा.[Note:-Unique User id you want for login give in "Name" field.]',
    lblFullName: 'नाव (or User ID)', lblEmail: 'ईमेल पत्ता (SMS पासकोड साठी)',
    lblPhone: 'मोबाईल नंबर',
    lblReason: 'आपण काय योगदान देऊ इच्छिता? (कारण)',
    btnSendReq: 'ADMIN कडे अर्ज पाठवा',
    modalLoginTitle: 'प्रवेश (ADMIN / Creator Authentication)',
    lblUsername: 'युजर आयडी', lblPassword: 'पासकोड (Passkey)',
    btnLoginSubmit: 'सुरक्षित प्रवेश करा',
    filterAll: 'सर्व', filterCulture: 'संस्कृती', filterVlog: 'व्लॉग',
    filterPhoto: 'फोटो', filterVideo: 'व्हिडिओ'
  },
  en: {
    heroTag: '• Sahyadri Pride •',
    heroTitle: 'Welcome to <span class="highlight">Wavelvadi Village</span>',
    heroDesc: 'Nestled in the Sahyadri mountain ranges, Wavelwadi is an ideal cultural village with a scenic environment, rich heritage, organic farming, a tradition of unity, and respect for women.',
    btnExplore: 'Explore Village',
    btnCreatorReq: 'Become a Creator',
    statPop: '150+', statPopLabel: 'Village Population',
    statArea: '1,200 Hectares', statAreaLabel: 'Lush Green Area',
    statHeritage: '300+ Years', statHeritageLabel: 'Rich History',
    historyTag: 'History & Heritage', historyTitle: 'History of Wavelvadi',
    historyDesc: 'Inhabited for over 300 years in the lap of Sahyadris, Wavelvadi possesses ancient stepwells and water management systems.',
    cultureTag: 'Culture & Heritage', cultureTitle: 'Traditions of Wavelvadi',
    cultureDesc: 'पिढ्यानपिढ्या जपलेली शिमगा उत्सव, श्री राधाकृष्ण पालखी उत्सव, श्री गणेश चतुर्थी उत्सव, नवरात्रोत्सव आणि दीपावली.',
    vlogTag: 'Stories & Vlogs', vlogTitle: 'Wavelvadi Village Vlogs',
    vlogDesc: 'Immersive stories and video blogs captured by our approved local village creators.',
    galleryTag: 'Photo Gallery', galleryTitle: 'Wavelvadi Photo Collection',
    noticeTag: 'Announcements', noticeTitle: 'Village Noticeboard',
    devTag: 'Instagram', devTitle: 'Wavelvadi Progress',
    devDesc: 'Follow our official Instagram page for village vlogs, photos, cultural highlights, and reels.',
    devBadge: '📸 Official Instagram',
    devNotice: 'Follow and connect with Wavelvadi on our official Instagram page!',
    creatorTag: 'Contributors', creatorTitle: 'Wavelvadi Content Creators',
    creatorDesc: 'Approved local village contributors creating authentic cultural content under ADMIN administration.',
    navHome: 'Home', navHistory: 'History', navCulture: 'Culture',
    navVlogs: 'Vlogs', navGallery: 'Gallery', navNotices: 'Notices', navDev: 'Development',
    navLogin: 'Login',
    modalReqTitle: 'Request Creator Permission',
    modalReqDesc: 'Request permission from ADMIN to publish articles, vlogs, and photos on Wavelvadi portal.[Note:-Unique User id you want for login give in "Name" field.]',
    lblFullName: ' Name (or User ID)', lblEmail: 'Email Address (For SMS Credentials)',
    lblPhone: 'Phone Number',
    lblReason: 'Why do you want creator access?',
    btnSendReq: 'Submit Request to ADMIN',
    modalLoginTitle: 'Portal Login (ADMIN / Creator)',
    lblUsername: 'User ID', lblPassword: 'Password / Passkey',
    btnLoginSubmit: 'Secure Login',
    filterAll: 'All', filterCulture: 'Culture', filterVlog: 'Vlogs',
    filterPhoto: 'Photos', filterVideo: 'Videos'
  }
};


// ==========================================
// INIT
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  initLanguage();
  checkUserSession();
  loadPublicContent('all');
  loadCreatorsSection();
  initEventListeners();
  initMobileMenu();
  initMediaPreview();
});


// ==========================================
// MOBILE MENU
// ==========================================
function initMobileMenu() {
  const toggle = document.getElementById('mobileMenuToggle');
  const navMenu = document.getElementById('navLinksMenu');
  if (!toggle || !navMenu) return;

  toggle.addEventListener('click', () => {
    const isOpen = navMenu.classList.toggle('nav-open');
    toggle.innerHTML = isOpen ? '✕' : '☰';
    toggle.setAttribute('aria-expanded', isOpen);
  });

  // Close nav when a link is clicked
  navMenu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      navMenu.classList.remove('nav-open');
      toggle.innerHTML = '☰';
    });
  });
}


// ==========================================
// LANGUAGE SWITCHER
// ==========================================
function toggleLanguage() {
  currentLanguage = currentLanguage === 'mr' ? 'en' : 'mr';
  document.body.classList.toggle('en-mode', currentLanguage === 'en');
  document.getElementById('langToggleText').innerText = currentLanguage === 'mr' ? 'English' : 'मराठी';
  applyTranslations();
}

function initLanguage() {
  document.body.classList.toggle('en-mode', currentLanguage === 'en');
  applyTranslations();
}

function applyTranslations() {
  const dict = translations[currentLanguage];
  const setTxt = (id, key, isHTML = false) => {
    const el = document.getElementById(id);
    if (el && dict[key] !== undefined) {
      if (isHTML) el.innerHTML = dict[key];
      else el.innerText = dict[key];
    }
  };

  setTxt('heroTagText', 'heroTag');
  setTxt('heroTitleText', 'heroTitle', true);
  setTxt('heroDescText', 'heroDesc');
  setTxt('btnExploreText', 'btnExplore');
  setTxt('btnCreatorReqText', 'btnCreatorReq');
  setTxt('statPopText', 'statPop'); setTxt('statPopLabel', 'statPopLabel');
  setTxt('statAreaText', 'statArea'); setTxt('statAreaLabel', 'statAreaLabel');
  setTxt('statHeritageText', 'statHeritage'); setTxt('statHeritageLabel', 'statHeritageLabel');
  setTxt('historyTagText', 'historyTag'); setTxt('historyTitleText', 'historyTitle');
  setTxt('historyDescText', 'historyDesc');
  setTxt('cultureTagText', 'cultureTag'); setTxt('cultureTitleText', 'cultureTitle');
  setTxt('cultureDescText', 'cultureDesc');
  setTxt('vlogTagText', 'vlogTag'); setTxt('vlogTitleText', 'vlogTitle');
  setTxt('vlogDescText', 'vlogDesc');
  setTxt('galleryTagText', 'galleryTag'); setTxt('galleryTitleText', 'galleryTitle');
  setTxt('noticeTagText', 'noticeTag'); setTxt('noticeTitleText', 'noticeTitle');
  setTxt('devTagText', 'devTag'); setTxt('devTitleText', 'devTitle');
  setTxt('devDescText', 'devDesc'); setTxt('devBadgeText', 'devBadge');
  setTxt('devNoticeText', 'devNotice');
  setTxt('creatorTagText', 'creatorTag'); setTxt('creatorTitleText', 'creatorTitle');
  setTxt('creatorDescText', 'creatorDesc');
  setTxt('navHomeText', 'navHome'); setTxt('navHistoryText', 'navHistory');
  setTxt('navCultureText', 'navCulture'); setTxt('navVlogsText', 'navVlogs');
  setTxt('navGalleryText', 'navGallery'); setTxt('navNoticesText', 'navNotices');
  setTxt('navDevText', 'navDev'); setTxt('navLoginText', 'navLogin');
  setTxt('modalReqTitleText', 'modalReqTitle');
  setTxt('modalReqDescText', 'modalReqDesc');
  setTxt('lblFullNameText', 'lblFullName'); setTxt('lblEmailText', 'lblEmail');
  setTxt('lblPhoneText', 'lblPhone'); setTxt('lblReasonText', 'lblReason');
  setTxt('btnSendReqText', 'btnSendReq');
  setTxt('modalLoginTitleText', 'modalLoginTitle');
  setTxt('lblUsernameText', 'lblUsername'); setTxt('lblPasswordText', 'lblPassword');
  setTxt('btnLoginSubmitText', 'btnLoginSubmit');
  setTxt('filterAllBtn', 'filterAll'); setTxt('filterCultureBtn', 'filterCulture');
  setTxt('filterVlogBtn', 'filterVlog'); setTxt('filterPhotoBtn', 'filterPhoto');
  setTxt('filterVideoBtn', 'filterVideo');

  if (allPublishedContent.length > 0) {
    renderPublicContent();
  } else {
    loadPublicContent(currentActiveCategory || 'all');
  }
}


// ==========================================
// SESSION & AUTHENTICATION API
// ==========================================
async function checkUserSession() {
  try {
    const res = await fetch('/api/session');
    const data = await res.json();
    currentUser = data;

    const navLoginBtn = document.getElementById('navLoginBtn');
    const navDashboardBtn = document.getElementById('navDashboardBtn');
    const addContentBtn = document.getElementById('addContentBtn');
    const creatorsTabBtn = document.getElementById('creatorsTabBtn');
    const backupTabBtn = document.getElementById('backupTabBtn');
    const gscriptTabBtn = document.getElementById('gscriptTabBtn');

    if (data.logged_in) {
      if (navLoginBtn) navLoginBtn.style.display = 'none';
      if (navDashboardBtn) {
        navDashboardBtn.style.display = 'inline-flex';
        const roleLabel = data.is_admin ? 'ADMIN' : data.role.toUpperCase();
        navDashboardBtn.innerHTML = `🛡️ ${data.username} (${roleLabel})`;
      }
      // Creators and ADMIN can both upload/submit content
      if (addContentBtn) addContentBtn.style.display = 'inline-flex';

      const publishGroup = document.getElementById('publishNowGroup');
      const modalNote = document.getElementById('addContentModalNote');
      if (publishGroup) publishGroup.style.display = data.is_admin ? 'flex' : 'none';
      if (modalNote) {
        modalNote.innerHTML = data.is_admin
          ? '👑 <strong>ADMIN:</strong> आपण थेट प्रकाशित करू शकता किंवा ड्राफ्ट म्हणून ठेवू शकता.'
          : '✍️ <strong>क्रिएटर:</strong> आपला मजकूर मुख्य प्रशासक (ADMIN) कडे ईमेल परवानगीसाठी पाठवला जाईल. ईमेल मंजुरीनंतर प्रसिद्ध होईल.';
      }

      // Show admin-only tabs
      if (data.is_admin) {
        if (creatorsTabBtn) creatorsTabBtn.style.display = 'inline-block';
        if (backupTabBtn) backupTabBtn.style.display = 'inline-block';
        if (gscriptTabBtn) gscriptTabBtn.style.display = 'inline-block';
      }
    } else {
      if (navLoginBtn) navLoginBtn.style.display = 'inline-flex';
      if (navDashboardBtn) navDashboardBtn.style.display = 'none';
      if (addContentBtn) addContentBtn.style.display = 'none';
    }
  } catch (err) {
    console.error('Session check error:', err);
  }
}

async function handleLoginSubmit(e) {
  e.preventDefault();
  const username = document.getElementById('loginUsername').value.trim();
  const password = document.getElementById('loginPassword').value.trim();
  const msgBox = document.getElementById('loginMsg');

  msgBox.style.color = '#B45309';
  msgBox.innerText = 'लॉगिन होत आहे...';

  try {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();

    if (data.success) {
      msgBox.style.color = 'green';
      msgBox.innerText = data.message;
      setTimeout(() => {
        closeModal('loginModal');
        checkUserSession();
        if (data.role === 'ADMIN') {
          openAdminDashboard();
        }
      }, 900);
    } else {
      msgBox.style.color = 'red';
      msgBox.innerText = data.message;
    }
  } catch (err) {
    msgBox.style.color = 'red';
    msgBox.innerText = 'Login error. Please try again.';
  }
}

async function handleLogout() {
  await fetch('/api/logout', { method: 'POST' });
  closeModal('dashboardModal');
  currentUser = { logged_in: false, role: 'public', username: '', is_admin: false };
  checkUserSession();
  showToast('Logged out successfully.', 'info');
}

function togglePasswordVisibility(inputId) {
  const input = document.getElementById(inputId);
  if (!input) return;
  input.type = input.type === 'password' ? 'text' : 'password';
}


// ==========================================
// CREATOR REQUEST API
// ==========================================
async function handleCreatorRequestSubmit(e) {
  e.preventDefault();
  const full_name = document.getElementById('reqFullName').value.trim();
  const email = document.getElementById('reqEmail').value.trim();
  const phone = document.getElementById('reqPhone').value.trim();
  const reason = document.getElementById('reqReason').value.trim();
  const instagram_url = document.getElementById('reqInstagram')?.value.trim() || '';
  const msgBox = document.getElementById('reqMsg');

  msgBox.style.color = '#B45309';
  msgBox.innerText = 'ADMIN प्रशासकाकडे अर्ज सादर केला जात आहे...';

  try {
    const res = await fetch('/api/creator/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ full_name, email, phone, reason, instagram_url })
    });
    const data = await res.json();

    if (data.success) {
      msgBox.style.color = 'green';
      msgBox.innerHTML = `✅ ${data.message}`;
      document.getElementById('creatorRequestForm').reset();
    } else {
      msgBox.style.color = 'red';
      msgBox.innerText = data.message;
    }
  } catch (err) {
    msgBox.style.color = 'red';
    msgBox.innerText = 'Network error. Please try again later.';
  }
}


// ==========================================
// CONTENT DISPLAY API & RENDERING
// ==========================================
async function loadPublicContent(category = null) {
  if (category) {
    currentActiveCategory = category;
  }

  // Update filter buttons UI
  document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
  const key = `filter${currentActiveCategory.charAt(0).toUpperCase() + currentActiveCategory.slice(1)}Btn`;
  const activeBtn = document.getElementById(key) || document.getElementById('filterAllBtn');
  if (activeBtn) activeBtn.classList.add('active');

  try {
    const res = await fetch('/api/content');
    const data = await res.json();
    if (!data.success) return;
    allPublishedContent = data.content || [];
    renderPublicContent();
  } catch (err) {
    console.error('Failed to load content:', err);
  }
}

function renderPublicContent() {
  // 1. Vlogs Section (always shows all published vlogs)
  const vlogsContainer = document.getElementById('vlogsContainer');
  if (vlogsContainer) {
    const vlogs = allPublishedContent.filter(item => item.category === 'vlog' || item.category === 'video' || item.media_type === 'video');
    vlogsContainer.innerHTML = vlogs.length > 0
      ? vlogs.map(item => createCardHTML(item)).join('')
      : '<p style="padding:1rem; color: var(--text-muted);">कोणतेही व्लॉग उपलब्ध नाहीत.</p>';
  }

  // 2. Gallery Section (filtered by currentActiveCategory)
  const galleryContainer = document.getElementById('galleryContainer');
  if (galleryContainer) {
    const gallery = (currentActiveCategory === 'all')
      ? allPublishedContent.filter(item => ['photo', 'culture', 'video', 'vlog'].includes(item.category))
      : allPublishedContent.filter(item => item.category === currentActiveCategory);
    galleryContainer.innerHTML = gallery.length > 0
      ? gallery.map(item => createCardHTML(item)).join('')
      : '<p style="padding:1rem; color: var(--text-muted);">या वर्गवारीत कोणतीही गॅलरी मीडिया उपलब्ध नाही.</p>';
  }

  // 3. Noticeboard Section (always shows all notices)
  const noticeContainer = document.getElementById('noticeContainer');
  if (noticeContainer) {
    const notices = allPublishedContent.filter(item => item.category === 'notice');
    noticeContainer.innerHTML = notices.length > 0 ? notices.map(item => {
      const nTitle = currentLanguage === 'mr' ? (item.title_mr || item.title_en) : (item.title_en || item.title_mr);
      const nDesc = currentLanguage === 'mr' ? (item.description_mr || item.description_en) : (item.description_en || item.description_mr);
      return `
        <div class="notice-item">
          <div class="notice-date">📢 सूचना</div>
          <div class="notice-content">
            <h4>${escapeHTML(nTitle)}</h4>
            <p>${escapeHTML(nDesc)}</p>
            <small style="color: var(--brand-gold);">प्रकाशक: ${escapeHTML(item.author_name || 'ADMIN')}</small>
          </div>
        </div>
      `;
    }).join('') : '<p style="padding:1rem; color: var(--text-muted);">सध्या कोणतीही जाहीर सूचना नाही.</p>';
  }
}

function createCardHTML(item) {
  const title = (currentLanguage === 'mr' ? (item.title_mr || item.title_en) : (item.title_en || item.title_mr)) || 'वावेलवाडी';
  const desc = (currentLanguage === 'mr' ? (item.description_mr || item.description_en) : (item.description_en || item.description_mr)) || '';
  const hasYoutube = Boolean(item.youtube_url && item.youtube_url.trim());
  const hasDrive = Boolean(item.google_drive_url && item.google_drive_url.trim());

  let mediaEl = '';
  const ytId = hasYoutube ? extractYouTubeId(item.youtube_url) : '';
  const startSec = hasYoutube ? extractYouTubeStartTime(item.youtube_url) : 0;
  const youtubeWatchUrl = ytId ? `https://www.youtube.com/watch?v=${ytId}` : item.youtube_url;

  if (hasYoutube && ytId) {
    const posterUrl = `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
    mediaEl = `
      <div class="card-media-wrapper yt-wrapper" onclick="playYouTubeVideo(this, '${ytId}', '${escapeHTML(title)}', ${startSec})" title="वेबसाइटवर प्ले करा">
        <div class="yt-facade">
          <img src="${posterUrl}" alt="${escapeHTML(title)}" loading="lazy" onerror="this.src='https://img.youtube.com/vi/${ytId}/mqdefault.jpg'" />
          <div class="yt-play-btn" role="button" aria-label="Play video">
            <svg viewBox="0 0 68 48" class="yt-play-svg">
              <path class="yt-play-bg" d="M66.52,7.74c-0.78-2.93-2.49-5.41-5.42-6.19C55.79,0.13,34,0,34,0S12.21,0.13,6.9,1.55 C3.97,2.33,2.27,4.81,1.48,7.74C0.06,13.05,0,24,0,24s0.06,10.95,1.48,16.26c0.78,2.93,2.49,5.41,5.42,6.19 C12.21,47.87,34,48,34,48s21.79-0.13,27.1-1.55c2.93-0.78,4.64-3.26,5.42-6.19C67.94,34.95,68,24,68,24S67.94,13.05,66.52,7.74z" fill="#ff0000"></path>
              <path d="M 45,24 27,14 27,34" fill="#ffffff"></path>
            </svg>
          </div>
        </div>
        <span class="media-badge yt-badge">▶ YouTube</span>
      </div>`;
  } else if (item.media_type === 'video') {
    let videoSrc = item.media_url || item.google_drive_url;
    let driveUrl = item.google_drive_url || videoSrc;
    let playTarget = (item.media_url && item.media_url.startsWith('/api/video/')) ? item.media_url : (item.id ? `/api/video/${item.id}` : videoSrc);
    let isNativeStream = playTarget && playTarget.startsWith('/api/video/');
    let thumbEl = '';

    if (isNativeStream) {
      thumbEl = `<video src="${playTarget}#t=0.5" poster="/static/images/hero_wavelvadi.svg" preload="metadata" muted playsinline style="width:100%; height:100%; object-fit:cover; opacity:0.92; pointer-events:none;"></video>`;
    } else {
      let thumbUrl = '/static/images/hero_wavelvadi.svg';
      if (driveUrl && (driveUrl.includes('drive.google.com') || hasDrive)) {
        let fileIdMatch = driveUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || driveUrl.match(/id=([a-zA-Z0-9_-]+)/);
        if (fileIdMatch) thumbUrl = `https://lh3.googleusercontent.com/d/${fileIdMatch[1]}`;
      }
      thumbEl = `<img src="${thumbUrl}" alt="${escapeHTML(title)}" loading="lazy" onerror="this.src='/static/images/hero_wavelvadi.svg'" style="width:100%; height:100%; object-fit:cover; opacity:0.88;" />`;
    }

    mediaEl = `
      <div class="card-media-wrapper yt-wrapper" onclick="openWebsiteVideoModal('${playTarget}', '${escapeHTML(title)}', '', 0, '${escapeHTML(driveUrl)}')" style="cursor:pointer; background:#0F172A;" title="वेबसाइटवर व्हिडिओ पहा">
        ${thumbEl}
        <div class="yt-play-icon">
          <svg viewBox="0 0 68 48" style="width:48px; height:48px;">
            <path d="M66.52,7.74c-0.78-2.93-2.49-5.41-5.42-6.19C55.79,0.13,34,0,34,0S12.21,0.13,6.9,1.55 C3.97,2.33,2.27,4.81,1.48,7.74C0.06,13.05,0,24,0,24s0.06,10.95,1.48,16.26c0.78,2.93,2.49,5.41,5.42,6.19 C12.21,47.87,34,48,34,48s21.79-0.13,27.1-1.55c2.93-0.78,4.64-3.26,5.42-6.19C67.94,34.95,68,24,68,24S67.94,13.05,66.52,7.74z" fill="#DC2626"></path>
            <path d="M 45,24 27,14 27,34" fill="#ffffff"></path>
          </svg>
        </div>
        <span class="media-badge">VIDEO</span>
      </div>`;
  } else {
    let imgSrc = item.media_url || '/static/images/hero_wavelvadi.svg';
    if (imgSrc && imgSrc.includes('drive.google.com')) {
      let fileIdMatch = imgSrc.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || imgSrc.match(/id=([a-zA-Z0-9_-]+)/);
      if (fileIdMatch) imgSrc = `https://lh3.googleusercontent.com/d/${fileIdMatch[1]}`;
    } else if (hasDrive && (!item.media_url || item.media_url.startsWith('/static/'))) {
      let fileIdMatch = item.google_drive_url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || item.google_drive_url.match(/id=([a-zA-Z0-9_-]+)/);
      if (fileIdMatch) imgSrc = `https://lh3.googleusercontent.com/d/${fileIdMatch[1]}`;
    }
    mediaEl = `
      <div class="card-media-wrapper">
        <img src="${imgSrc}" alt="${escapeHTML(title)}" loading="lazy" onerror="this.src='/static/images/hero_wavelvadi.svg'" />
        <span class="media-badge">${item.category ? item.category.toUpperCase() : 'PHOTO'}</span>
      </div>`;
  }

  const videoActionBtn = hasYoutube
    ? `<button type="button" onclick="openWebsiteVideoModal('${ytId}', '${escapeHTML(title)}', '${escapeHTML(youtubeWatchUrl)}', ${startSec})" class="card-yt-link card-play-action" title="वेबसाइटवर व्हिडिओ पहा">
        <span>▶</span> व्हिडिओ पहा
       </button>
       <a href="${youtubeWatchUrl}" target="_blank" rel="noopener noreferrer" class="card-yt-link yt-ext-link" title="YouTube वर उघडा">
        <span>↗</span> YouTube
       </a>`
    : (item.media_type === 'video'
      ? `<button type="button" onclick="openWebsiteVideoModal('${(item.media_url && item.media_url.startsWith('/api/video/')) ? item.media_url : (item.id ? `/api/video/${item.id}` : (item.media_url || item.google_drive_url))}', '${escapeHTML(title)}', '', 0, '${escapeHTML(item.google_drive_url || '')}')" class="card-yt-link card-play-action" title="वेबसाइटवर व्हिडिओ पहा">
          <span>▶</span> व्हिडिओ पहा
         </button>`
      : '');

  const driveLinkBtn = hasDrive
    ? `<a href="${item.google_drive_url}" target="_blank" rel="noopener noreferrer" class="card-drive-link">☁️ Drive</a>`
    : '';

  return `
    <div class="content-card" data-id="${item.id}">
      ${mediaEl}
      <div class="card-body">
        <div class="card-meta">
          <span>📅 ${item.created_at ? item.created_at.substring(0, 10) : '२०२६'}</span>
          <span>🛡️ ADMIN Verified</span>
        </div>
        <h3 class="card-title">${escapeHTML(title)}</h3>
        <p class="card-text">${escapeHTML(desc)}</p>

        <div class="card-links">
          ${videoActionBtn}
          ${driveLinkBtn}
        </div>

        <div class="card-author">
          <span>✍️ ${escapeHTML(item.author_name || 'वावेलवाडी क्रिएटर')}</span>
        </div>
      </div>
    </div>
  `;
}

function playYouTubeVideo(container, ytId, title, startTime) {
  if (!container || !ytId) return;
  if (container.querySelector('iframe')) return;

  const startParam = startTime && startTime > 0 ? `&start=${startTime}` : '';
  const titleText = title || 'YouTube video';
  container.innerHTML = `
    <iframe
      src="https://www.youtube-nocookie.com/embed/${ytId}?autoplay=1&rel=0${startParam}"
      title="${escapeHTML(titleText)}"
      frameborder="0"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      referrerpolicy="strict-origin-when-cross-origin"
      allowfullscreen
      style="width:100%; height:100%; border:none;"></iframe>
    <span class="media-badge yt-badge">▶ YouTube</span>
  `;
}

function extractYouTubeStartTime(url) {
  if (!url || typeof url !== 'string') return 0;
  try {
    const u = new URL(url.startsWith('http') ? url : 'https://' + url);
    const t = u.searchParams.get('t') || u.searchParams.get('start');
    if (t) {
      const match = t.match(/^(\d+)/);
      if (match) return parseInt(match[1], 10);
    }
  } catch {}
  return 0;
}

function openWebsiteVideoModal(source, title, watchUrl, startTime, fallbackDriveUrl) {
  const modal = document.getElementById('videoPlayerModal');
  const frameContainer = document.getElementById('videoModalFrameContainer');
  const titleEl = document.getElementById('videoModalTitle');
  const directBtn = document.getElementById('videoModalDirectBtn');
  if (!modal || !frameContainer) return;

  const cleanTitle = title || 'वावेलवाडी व्हिडिओ';
  if (titleEl) titleEl.innerText = cleanTitle;

  const ytId = extractYouTubeId(source || watchUrl || '');
  if (ytId) {
    const startSec = startTime || extractYouTubeStartTime(watchUrl || source || '');
    const startParam = startSec && startSec > 0 ? `&start=${startSec}` : '';
    const embedSrc = `https://www.youtube-nocookie.com/embed/${ytId}?autoplay=1&rel=0${startParam}`;
    frameContainer.innerHTML = `
      <iframe
        src="${embedSrc}"
        title="${escapeHTML(cleanTitle)}"
        frameborder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        referrerpolicy="strict-origin-when-cross-origin"
        allowfullscreen
        style="width:100%; height:100%; min-height:400px; border:none; border-radius:8px;"></iframe>
    `;
    if (directBtn) {
      directBtn.href = watchUrl || `https://www.youtube.com/watch?v=${ytId}`;
      directBtn.innerText = '🎬 YouTube वर उघडा (Open on YouTube)';
      directBtn.style.display = 'inline-flex';
    }
  } else if (source && (source.startsWith('/api/video/') || source.endsWith('.mp4') || source.endsWith('.webm') || source.endsWith('.mov') || source.startsWith('/uploads/') || source.startsWith('data:video/'))) {
    // Native HTML5 video player - plays instantly with full controls!
    const driveLink = fallbackDriveUrl || '';
    frameContainer.innerHTML = `
      <div style="background:#000; border-radius:8px; overflow:hidden; display:flex; flex-direction:column; align-items:center;">
        <video src="${source}" controls autoplay playsinline style="width:100%; max-height:460px; object-fit:contain; background:#000;"></video>
        ${driveLink ? `
        <div style="width:100%; padding:0.6rem 1rem; background:#0F172A; display:flex; justify-content:space-between; align-items:center; border-top:1px solid #334155;">
          <span style="color:#94A3B8; font-size:0.82rem;">☁️ Google Drive क्लाउड बॅकअप उपलब्ध आहे</span>
          <a href="${driveLink}" target="_blank" rel="noopener noreferrer" class="btn btn-primary btn-sm" style="background:#0284C7; font-size:0.8rem; padding:0.3rem 0.7rem;">
            📁 Drive वर उघडा
          </a>
        </div>` : ''}
      </div>
    `;
    if (directBtn) {
      if (driveLink) {
        directBtn.href = driveLink;
        directBtn.innerText = '📁 Google Drive वर पहा';
        directBtn.style.display = 'inline-flex';
      } else {
        directBtn.style.display = 'none';
      }
    }
  } else if (source && (source.includes('drive.google.com') || source.match(/\/file\/d\/[a-zA-Z0-9_-]+/))) {
    const m = source.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || source.match(/id=([a-zA-Z0-9_-]+)/);
    const fileId = m ? m[1] : '';
    const dEmbed = fileId ? `https://drive.google.com/file/d/${fileId}/preview` : source;
    const dDirect = fileId ? `https://drive.google.com/file/d/${fileId}/view?usp=sharing` : source;

    frameContainer.innerHTML = `
      <div style="position:relative; width:100%; height:100%; min-height:420px; background:#0F172A; border-radius:8px; overflow:hidden;">
        <iframe src="${dEmbed}" allow="autoplay; fullscreen" style="width:100%; height:100%; min-height:420px; border:none;"></iframe>
        <div style="padding:0.6rem 1rem; background:rgba(15,23,42,0.96); display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.5rem; border-top:1px solid #334155;">
          <span style="color:#CBD5E1; font-size:0.85rem;">🎬 व्हिडिओ प्ले होत नसल्यास थेट Google Drive वर उघडा:</span>
          <a href="${dDirect}" target="_blank" rel="noopener noreferrer" class="btn btn-primary btn-sm" style="background:#0284C7; font-size:0.85rem; padding:0.35rem 0.8rem;">
            ▶️ Google Drive वर प्ले करा
          </a>
        </div>
      </div>
    `;
    if (directBtn) {
      directBtn.href = dDirect;
      directBtn.innerText = '📁 Google Drive वर पहा';
      directBtn.style.display = 'inline-flex';
    }
  } else if (source) {
    frameContainer.innerHTML = `<video src="${source}" controls autoplay playsinline style="width:100%; height:100%; max-height:480px; object-fit:contain; border-radius:8px; background:#000;"></video>`;
    if (directBtn) directBtn.style.display = 'none';
  }

  openModal('videoPlayerModal');
}

function closeVideoModal() {
  const frameContainer = document.getElementById('videoModalFrameContainer');
  if (frameContainer) frameContainer.innerHTML = '';
  closeModal('videoPlayerModal');
}

function extractYouTubeId(url) {
  if (!url || typeof url !== 'string') return '';
  const str = url.trim();
  if (/^[\w-]{11}$/.test(str)) return str;

  const regExp = /(?:youtu\.be\/|(?:www\.|m\.)?youtube(?:-nocookie)?\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/|live\/))([\w-]{11})/;
  const match = str.match(regExp);
  if (match && match[1]) return match[1];

  try {
    const u = new URL(str.startsWith('http') ? str : 'https://' + str);
    if (u.searchParams.get('v')) return u.searchParams.get('v');
    const parts = u.pathname.split('/').filter(Boolean);
    if (parts.length > 0) {
      const last = parts[parts.length - 1];
      if (last.length === 11) return last;
    }
  } catch {}
  return '';
}

function escapeHTML(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}


// ==========================================
// ADMIN DASHBOARD & APPROVAL WORKFLOW
// ==========================================
async function openAdminDashboard() {
  if (!currentUser.logged_in) return;
  openModal('dashboardModal');
  await checkUserSession();
  loadAdminTab('drafts');
}

async function loadAdminTab(tab) {
  document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
  const container = document.getElementById('dashboardContent');
  container.innerHTML = '<div class="loading-spinner">⏳ माहिती लोड होत आहे...</div>';

  if (tab === 'drafts') {
    setActiveTab(0);
    await loadContentDatabase(container);
  } else if (tab === 'requests') {
    setActiveTab(1);
    await loadCreatorRequests(container);
  } else if (tab === 'creators') {
    setActiveTab(2);
    await loadCreatorsManagement(container);
  } else if (tab === 'backup') {
    setActiveTab(3);
    await loadBackupStorage(container);
  } else if (tab === 'googlescript') {
    setActiveTab(4);
    await loadGoogleScriptInfo(container);
  }
}

function setActiveTab(index) {
  const tabs = document.querySelectorAll('.admin-tab');
  if (tabs[index]) tabs[index].classList.add('active');
}

// ------------------------------------------
// CONTENT DATABASE TAB
// ------------------------------------------
async function loadContentDatabase(container) {
  try {
    const res = await fetch('/api/admin/content');
    const data = await res.json();

    if (!data.success || data.content.length === 0) {
      container.innerHTML = '<p style="padding:1rem; color: var(--text-muted);">कोणतेही कंटेंट उपलब्ध नाही.</p>';
      return;
    }

    container.innerHTML = `
      <div style="overflow-x: auto;">
        <table class="data-table">
          <thead>
            <tr>
              <th>#</th>
              <th>शीर्षक (Title)</th>
              <th>प्रकार</th>
              <th>लेखक</th>
              <th>स्थिती</th>
              <th>कृती (Action)</th>
            </tr>
          </thead>
          <tbody>
            ${data.content.map(item => `
              <tr>
                <td>${item.id}</td>
                <td>
                  <strong>${escapeHTML(item.title_mr)}</strong>
                  ${item.youtube_url ? '<br/><small style="color:red;">▶ YouTube</small>' : ''}
                  ${item.google_drive_url ? '<small style="color:blue;"> ☁️ Drive</small>' : ''}
                </td>
                <td><span class="badge badge-pending">${item.category}</span></td>
                <td>${escapeHTML(item.author_name)}</td>
                <td>
                  <span class="badge ${item.status === 'published' ? 'badge-published' : (item.status === 'pending' ? 'badge-pending' : (item.status === 'rejected' ? 'badge-danger' : 'badge-draft'))}">
                    ${item.status === 'pending' ? '⏳ Email Pending' : (item.status === 'published' ? '✅ Published' : (item.status === 'rejected' ? '❌ Rejected' : '📝 Draft'))}
                  </span>
                </td>
                <td class="action-cell">
                  ${currentUser.is_admin && item.status !== 'published' ? `<button onclick="publishContentItem(${item.id})" class="btn btn-gold btn-sm">✅ Approve</button>` : ''}
                  ${currentUser.is_admin && item.status === 'pending' ? `<button onclick="rejectContentItem(${item.id})" class="btn btn-danger btn-sm" style="background:#DC2626;">❌ Reject</button>` : ''}
                  ${currentUser.is_admin ? `<button onclick="deleteContentItem(${item.id})" class="btn btn-danger btn-sm">🗑 Delete</button>` : ''}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  } catch (err) {
    container.innerHTML = `<p style="color:red; padding:1rem;">Error: ${err.message}</p>`;
  }
}

// ------------------------------------------
// CREATOR REQUESTS TAB
// ------------------------------------------
async function loadCreatorRequests(container) {
  if (!currentUser.is_admin) {
    container.innerHTML = '<p style="padding:1rem; color: var(--text-muted);">फक्त ADMIN प्रशासक क्रिएटर अर्ज पाहू शकतात.</p>';
    return;
  }

  try {
    const res = await fetch('/api/admin/creator-requests');
    const data = await res.json();

    if (!data.success || data.requests.length === 0) {
      container.innerHTML = '<p style="padding:1rem; color: var(--text-muted);">कोणताही प्रलंबित क्रिएटर अर्ज नाही.</p>';
      return;
    }

    container.innerHTML = `
      <div style="overflow-x: auto;">
        <table class="data-table">
          <thead>
            <tr>
              <th>नाव (Name)</th>
              <th>ईमेल / मोबाईल</th>
              <th>कारण (Reason)</th>
              <th>स्थिती</th>
              <th>ADMIN Action</th>
            </tr>
          </thead>
          <tbody>
            ${data.requests.map(req => `
              <tr>
                <td><strong>${escapeHTML(req.full_name)}</strong></td>
                <td>${escapeHTML(req.email)}<br/><small style="color:var(--brand-brown);">${req.phone || ''}</small></td>
                <td style="max-width: 200px; word-wrap: break-word;">${escapeHTML(req.reason)}</td>
                <td>
                  <span class="badge ${req.status === 'approved' ? 'badge-published' : (req.status === 'pending' ? 'badge-pending' : 'badge-draft')}">${req.status}</span>
                </td>
                <td class="action-cell">
                  ${req.status === 'pending' ? `
                    <button onclick="openApproveModal(${req.id})" class="btn btn-primary btn-sm">✅ Approve</button>
                    <button onclick="processCreatorReq(${req.id}, 'reject')" class="btn btn-danger btn-sm">❌ Reject</button>
                  ` : ''}
                  <button onclick="deleteCreatorRequest(${req.id})" class="btn btn-sm" style="background:#FEE2E2; color:#991B1B;">🗑 Delete</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  } catch (err) {
    container.innerHTML = `<p style="color:red; padding:1rem;">Error: ${err.message}</p>`;
  }
}

// ------------------------------------------
// CREATORS MANAGEMENT TAB
// ------------------------------------------
async function loadCreatorsManagement(container) {
  if (!currentUser.is_admin) return;

  container.innerHTML = '<div class="loading-spinner">क्रिएटर डेटा लोड होत आहे...</div>';

  try {
    const [profilesRes, usersRes] = await Promise.all([
      fetch('/api/admin/creator-profiles'),
      fetch('/api/admin/creators')
    ]);

    const profilesData = await profilesRes.json();
    const usersData = await usersRes.json();

    const profiles = profilesData.creators || [];
    const userAccounts = usersData.creators || [];

    container.innerHTML = `
      <div style="padding: 1rem;">
        <!-- Top Action Bar -->
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 0.75rem; background: var(--bg-warm-accent); padding: 1rem; border-radius: var(--radius-sm); border: 1px solid var(--brand-border-gold);">
          <div>
            <h3 style="color: var(--brand-brown); margin: 0 0 0.25rem 0;">📸 अधिकृत क्रिएटर व सण-उत्सव प्रोफाईल</h3>
            <p style="font-size: 0.82rem; color: var(--text-muted); margin: 0;">वेबसाइटवर दिसणारे क्रिएटर, त्यांचे सण/उत्सव फोटो आणि थेट Instagram प्रोफाईल लिंक व्यवस्थापित करा.</p>
          </div>
          <button onclick="openCreatorModal()" class="btn btn-primary" style="font-size: 0.85rem;">
            ➕ नवीन क्रिएटर / उत्सव इमेज जोडा (Add Creator)
          </button>
        </div>

        <!-- Section 1: Creator Profiles (Homepage Cards) -->
        <div style="margin-bottom: 2rem;">
          <h4 style="color: var(--brand-brown); margin-bottom: 0.75rem;">🌟 मुख्य पृष्ठावरील क्रिएटर कार्डे (${profiles.length})</h4>
          ${profiles.length === 0 ? '<p style="color: var(--text-muted); font-size: 0.9rem;">कोणतेही प्रोफाईल उपलब्ध नाही. वरील बटणावरून नवीन जोडा.</p>' : `
            <div style="overflow-x: auto;">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>फोटो / इमेज</th>
                    <th>नाव व पद</th>
                    <th>माहिती / बायो</th>
                    <th>Instagram लिंक</th>
                    <th>कृती (Actions)</th>
                  </tr>
                </thead>
                <tbody>
                  ${profiles.map(p => {
                    const imgThumb = p.image_url 
                      ? `<img src="${escapeHTML(p.image_url)}" alt="${escapeHTML(p.name)}" style="width: 48px; height: 48px; border-radius: 50%; object-fit: cover; border: 2px solid var(--brand-gold);" />`
                      : `<div style="width:48px; height:48px; border-radius:50%; background:#FEF3C7; display:flex; align-items:center; justify-content:center; font-size:1.4rem;">👤</div>`;
                    const cleanInsta = formatInstagramUrl(p.instagram_url);
                    const handle = getInstagramHandle(p.instagram_url);

                    return `
                      <tr>
                        <td style="text-align: center;">${imgThumb}</td>
                        <td>
                          <strong>${escapeHTML(p.name)}</strong>
                          <br/><span style="font-size: 0.75rem; color: var(--brand-green); font-weight: 600;">${escapeHTML(p.role_title || 'Creator')}</span>
                        </td>
                        <td style="font-size: 0.83rem; max-width: 250px; color: var(--text-muted);">${escapeHTML(p.bio || '-')}</td>
                        <td>
                          ${cleanInsta ? `
                            <a href="${cleanInsta}" target="_blank" rel="noopener noreferrer" style="color: #E1306C; font-weight: bold; font-size: 0.82rem; display: inline-flex; align-items: center; gap: 0.3rem;">
                              📸 ${escapeHTML(handle)}
                            </a>
                          ` : '<span style="color: var(--text-light); font-size: 0.8rem;">लिंक नाही</span>'}
                        </td>
                        <td>
                          <div style="display: flex; gap: 0.4rem;">
                            <button onclick="openCreatorModal(${p.id})" class="btn btn-sm btn-gold">✏️ एडिट</button>
                            <button onclick="deleteCreatorProfile(${p.id}, '${escapeHTML(p.name)}')" class="btn btn-danger btn-sm">🗑 हटवा</button>
                          </div>
                        </td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>
          `}
        </div>

        <!-- Section 2: Creator User Accounts -->
        <div>
          <h4 style="color: var(--brand-brown); margin-bottom: 0.75rem;">🔑 पोर्टल क्रिएटर लॉगिन युजर्स (${userAccounts.length})</h4>
          ${userAccounts.length === 0 ? '<p style="color: var(--text-muted); font-size: 0.9rem;">कोणतेही लॉगिन खाते नाही.</p>' : `
            <div style="overflow-x: auto;">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Username</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  ${userAccounts.map(c => `
                    <tr>
                      <td>${c.id}</td>
                      <td><strong>${escapeHTML(c.username)}</strong></td>
                      <td>${escapeHTML(c.email)}</td>
                      <td>${c.role}</td>
                      <td><span class="badge ${c.status === 'approved' ? 'badge-published' : 'badge-draft'}">${c.status}</span></td>
                      <td>
                        <button onclick="deleteCreator(${c.id}, '${escapeHTML(c.username)}')" class="btn btn-danger btn-sm">🗑 हटवा</button>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          `}
        </div>
      </div>
    `;
  } catch (err) {
    container.innerHTML = `<p style="color:red; padding:1rem;">Error: ${err.message}</p>`;
  }
}

// ==========================================
// PUBLIC CREATORS SECTION
// ==========================================
async function loadCreatorsSection() {
  const grid = document.getElementById('creatorsGrid');
  if (!grid) return;

  try {
    const res = await fetch('/api/creators');
    const data = await res.json();
    if (!data.success || !data.creators || data.creators.length === 0) return;

    grid.innerHTML = data.creators.map(c => {
      const cleanInsta = formatInstagramUrl(c.instagram_url);
      const handle = getInstagramHandle(c.instagram_url);
      const imgHtml = c.image_url
        ? `<div class="creator-img-wrap">
             <img src="${escapeHTML(c.image_url)}" alt="${escapeHTML(c.name)}" class="creator-img" onerror="this.onerror=null; this.src='/static/images/ShriGanesh.jpeg';" />
           </div>`
        : `<div class="creator-avatar">👑</div>`;

      return `
        <div class="creator-card">
          ${imgHtml}
          <h3 class="creator-name">${escapeHTML(c.name)}</h3>
          <span class="creator-badge">${escapeHTML(c.role_title || 'क्रिएटर')}</span>
          <p class="creator-bio">${escapeHTML(c.bio || '')}</p>
          ${cleanInsta ? `
            <a href="${cleanInsta}" target="_blank" rel="noopener noreferrer" class="creator-insta-btn" title="Follow ${escapeHTML(c.name)} on Instagram">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
              <span>${escapeHTML(handle)}</span>
            </a>
          ` : ''}
        </div>
      `;
    }).join('');
  } catch (err) {
    console.error('Error loading creators section:', err);
  }
}

function formatInstagramUrl(url) {
  if (!url) return '';
  url = url.trim();
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (url.startsWith('@')) return `https://www.instagram.com/${url.substring(1)}`;
  if (url.startsWith('instagram.com/')) return `https://www.${url}`;
  return `https://www.instagram.com/${url}`;
}

function getInstagramHandle(url) {
  if (!url) return 'Instagram';
  url = url.trim();
  if (url.startsWith('@')) return url;
  const match = url.match(/instagram\.com\/([a-zA-Z0-9._]+)/);
  if (match && match[1]) return '@' + match[1];
  return url.length > 20 ? 'Instagram' : '@' + url.replace(/^https?:\/\/(www\.)?instagram\.com\/?/, '');
}

async function openCreatorModal(creatorId = null) {
  const form = document.getElementById('creatorProfileForm');
  if (form) form.reset();

  const previewWrap = document.getElementById('creatorImagePreviewWrap');
  if (previewWrap) previewWrap.style.display = 'none';

  const msgBox = document.getElementById('creatorSaveMsg');
  if (msgBox) msgBox.innerText = '';

  const modalTitle = document.getElementById('creatorModalTitle');

  if (creatorId) {
    if (modalTitle) modalTitle.innerText = '✏️ क्रिएटर व उत्सव इमेज एडिट करा';
    try {
      const res = await fetch(`/api/admin/creator-profile/${creatorId}`);
      const data = await res.json();
      if (data.success && data.creator) {
        const c = data.creator;
        document.getElementById('creatorEditId').value = c.id;
        document.getElementById('creatorExistingImage').value = c.image_url || '';
        document.getElementById('creatorInputName').value = c.name || '';
        document.getElementById('creatorInputRole').value = c.role_title || '';
        document.getElementById('creatorInputBio').value = c.bio || '';
        document.getElementById('creatorInputInsta').value = c.instagram_url || '';

        if (c.image_url) {
          const previewImg = document.getElementById('creatorImagePreview');
          if (previewImg) previewImg.src = c.image_url;
          if (previewWrap) previewWrap.style.display = 'block';
        }
      }
    } catch (err) {
      showToast('Error loading creator: ' + err.message, 'error');
    }
  } else {
    if (modalTitle) modalTitle.innerText = '📸 नवीन क्रिएटर व सण-उत्सव इमेज जोडा';
    document.getElementById('creatorEditId').value = '';
    document.getElementById('creatorExistingImage').value = '';
  }

  openModal('creatorProfileModal');
}

function previewCreatorImage(event) {
  const file = event.target.files && event.target.files[0];
  const previewWrap = document.getElementById('creatorImagePreviewWrap');
  const previewImg = document.getElementById('creatorImagePreview');

  if (file && previewImg && previewWrap) {
    const reader = new FileReader();
    reader.onload = (e) => {
      previewImg.src = e.target.result;
      previewWrap.style.display = 'block';
    };
    reader.readAsDataURL(file);
  }
}

async function handleCreatorProfileSubmit(e) {
  e.preventDefault();
  const form = document.getElementById('creatorProfileForm');
  const msgBox = document.getElementById('creatorSaveMsg');
  const btn = document.getElementById('btnSaveCreator');

  if (msgBox) {
    msgBox.style.color = '#B45309';
    msgBox.innerText = 'अपलोड व सेव्ह केले जात आहे...';
  }
  if (btn) btn.disabled = true;

  try {
    const formData = new FormData(form);
    const res = await fetch('/api/admin/creator-profile/save', {
      method: 'POST',
      body: formData
    });
    const data = await res.json();

    if (data.success) {
      if (msgBox) {
        msgBox.style.color = 'green';
        msgBox.innerText = '✅ ' + data.message;
      }
      showToast(data.message, 'success');

      // Reload both the public grid and admin tab
      loadCreatorsSection();
      const adminContainer = document.getElementById('dashboardContent');
      if (adminContainer) {
        loadCreatorsManagement(adminContainer);
      }

      setTimeout(() => {
        closeModal('creatorProfileModal');
        if (btn) btn.disabled = false;
        if (msgBox) msgBox.innerText = '';
      }, 1500);
    } else {
      if (msgBox) {
        msgBox.style.color = 'red';
        msgBox.innerText = '❌ ' + data.message;
      }
      if (btn) btn.disabled = false;
    }
  } catch (err) {
    if (msgBox) {
      msgBox.style.color = 'red';
      msgBox.innerText = 'Error: ' + err.message;
    }
    if (btn) btn.disabled = false;
  }
}

async function deleteCreatorProfile(creatorId, name) {
  if (!confirm(`आपण क्रिएटर "${name}" ला प्रोफाइलमधून नक्की हटवू इच्छिता?`)) return;

  try {
    const res = await fetch(`/api/admin/creator-profile/${creatorId}/delete`, { method: 'POST' });
    const data = await res.json();
    showToast(data.message, data.success ? 'success' : 'error');

    if (data.success) {
      loadCreatorsSection();
      const adminContainer = document.getElementById('dashboardContent');
      if (adminContainer) {
        loadCreatorsManagement(adminContainer);
      }
    }
  } catch (err) {
    showToast('Error: ' + err.message, 'error');
  }
}

// ------------------------------------------
// BACKUP STORAGE TAB
// ------------------------------------------
async function loadBackupStorage(container) {
  if (!currentUser.is_admin) return;

  try {
    const res = await fetch('/api/admin/backup-storage');
    const data = await res.json();

    if (!data.success || data.backups.length === 0) {
      container.innerHTML = `
        <div style="padding:1.5rem;">
          <p style="color: var(--text-muted); margin-bottom: 1rem;">कोणतेही बॅकअप डेटा नाही.</p>
          <div class="info-box">
            <h4>📖 Google Apps Script Integration</h4>
            <p>Google Drive स्टोरेज सेट करण्यासाठी:</p>
            <ol style="padding-left: 1.25rem; color: var(--text-muted); font-size: 0.9rem;">
              <li>Google Apps Script Editor उघडा (script.google.com)</li>
              <li>नवीन Project तयार करा आणि खालील code paste करा</li>
              <li>Deploy → Web App म्हणून प्रकाशित करा</li>
              <li>Generated URL .env मध्ये GOOGLE_SCRIPT_URL म्हणून save करा</li>
            </ol>
          </div>
        </div>
      `;
      return;
    }

    const formatSize = (bytes) => {
      if (!bytes) return 'N/A';
      if (bytes < 1024) return bytes + ' B';
      if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
      return (bytes / 1048576).toFixed(1) + ' MB';
    };

    container.innerHTML = `
      <div style="overflow-x: auto;">
        <table class="data-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Content</th>
              <th>File</th>
              <th>Size</th>
              <th>Backup Status</th>
              <th>Google Drive</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            ${data.backups.map(b => `
              <tr>
                <td>${b.id}</td>
                <td>
                  <strong style="font-size:0.85rem;">${escapeHTML(b.title_mr || 'N/A')}</strong>
                  <br/><small style="color: var(--text-light);">${b.category || ''}</small>
                </td>
                <td style="font-size:0.8rem; word-break:break-all;">${escapeHTML(b.original_filename)}</td>
                <td>${formatSize(b.file_size)}</td>
                <td>
                  <span class="badge ${b.backup_status === 'synced' ? 'badge-published' : 'badge-pending'}">
                    ${b.backup_status === 'synced' ? '✅ Synced' : '🔄 Local Only'}
                  </span>
                </td>
                <td>
                  ${b.google_drive_url ? `<a href="${b.google_drive_url}" target="_blank" class="btn btn-sm" style="background:#E8F0FE; color:#1967D2; font-size:0.75rem;">☁️ View Drive</a>` : `
                    <button onclick="syncBackupToDrive(${b.id})" class="btn btn-sm btn-gold" style="font-size:0.75rem;">☁️ Sync to Drive</button>
                  `}
                </td>
                <td>
                  <button onclick="deleteBackupRecord(${b.id})" class="btn btn-danger btn-sm">🗑</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  } catch (err) {
    container.innerHTML = `<p style="color:red; padding:1rem;">Error: ${err.message}</p>`;
  }
}

// ------------------------------------------
// GOOGLE SCRIPT INFO & TEST TAB
// ------------------------------------------
async function loadGoogleScriptInfo(container) {
  if (!currentUser.is_admin) return;

  try {
    const res = await fetch('/api/admin/google-script-config');
    const data = await res.json();

    container.innerHTML = `
      <div style="padding: 1rem;">
        <div class="info-box" style="margin-bottom: 1.5rem;">
          <h3 style="color: var(--brand-brown); margin-bottom: 0.5rem;">🔗 Google Apps Script & Cloud Storage Status</h3>
          <p><strong>Configured URL:</strong> ${data.configured ? `<a href="${data.script_url}" target="_blank" style="word-break:break-all;">${data.script_url}</a>` : '<span style="color:red;">❌ Not configured in .env</span>'}</p>
          
          <div style="margin-top: 1rem;">
            <button onclick="testGoogleScriptConnection()" class="btn btn-primary" id="btnTestGScript">
              🧪 Test Connection Now (कनेक्शन तपासा)
            </button>
            <span id="gscriptTestResult" style="margin-left: 1rem; font-weight: bold;"></span>
          </div>
        </div>

        <div class="info-box">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 0.75rem; flex-wrap:wrap; gap:0.5rem;">
            <h4 style="color: var(--brand-brown); margin: 0;">📋 Complete Google Apps Script Code (Code.gs)</h4>
            <button onclick="copyAppsScriptCode()" class="btn btn-sm btn-gold">📋 Copy Code</button>
          </div>
          <p style="font-size:0.85rem; color: var(--text-muted); margin-bottom: 0.75rem;">
            हा संपूर्ण कोड तुमच्या Google Apps Script (<a href="https://script.google.com" target="_blank">script.google.com</a>) मध्ये पेस्ट करा:
          </p>
          <pre id="appsScriptCodeBlock" style="background: #1C1917; color: #FBBF24; padding: 1rem; border-radius: 8px; font-family: monospace; font-size: 0.78rem; overflow-x: auto; white-space: pre-wrap; max-height: 250px;">${escapeHTML(data.script_code || '// google_apps_script.js')}</pre>

          <h5 style="color: var(--brand-brown); margin: 1.25rem 0 0.5rem 0;">🚀 स्टेप-बाय-स्टेप कनेक्शन सूचना (Step-by-Step Instructions):</h5>
          <ol style="color: var(--text-muted); font-size: 0.85rem; padding-left: 1.25rem; line-height: 1.8;">
            <li><strong>script.google.com</strong> उघडा आणि <strong>New project</strong> वर क्लिक करा.</li>
            <li>वरील कोड संपूर्ण कॉपी करून <code>Code.gs</code> मधील जुना मजकूर काढून तिथे पेस्ट करा.</li>
            <li>वर <strong>Save (💾)</strong> आयकॉनवर क्लिक करा.</li>
            <li>उजव्या कोपऱ्यात <strong>Deploy</strong> → <strong>New deployment</strong> निवडा.</li>
            <li>गियर (⚙️) चिन्हावर क्लिक करून <strong>Web app</strong> निवडा.</li>
            <li><strong>Execute as:</strong> मध्ये <strong>"Me (your_email@gmail.com)"</strong> निवडा. (अत्यंत महत्त्वाचे!)</li>
            <li><strong>Who has access:</strong> मध्ये <strong>"Anyone"</strong> निवडा. (महत्त्वाचे!)</li>
            <li><strong>Deploy</strong> वर क्लिक करा. पहिल्या वेळी <em>Authorize access</em> विचारल्यास <em>Advanced → Go to project (unsafe) → Allow</em> करा.</li>
            <li>तयार झालेली <strong>Web App URL</strong> कॉपी करा.</li>
            <li><code>.env</code> फाईलमध्ये <code>GOOGLE_SCRIPT_URL=&lt;तुमची-URL&gt;</code> जोडा.</li>
            <li>येथे येऊन <strong>Test Connection Now</strong> बटण दाबून खात्री करा!</li>
          </ol>
        </div>
      </div>
    `;
  } catch (err) {
    container.innerHTML = `<p style="color:red; padding:1rem;">Error loading config: ${err.message}</p>`;
  }
}


// ==========================================
// APPROVE CREATOR MODAL
// ==========================================
function openApproveModal(reqId) {
  document.getElementById('approveReqId').value = reqId;
  document.getElementById('customUsername').value = '';
  document.getElementById('customPassword').value = '';
  document.getElementById('approveMsg').innerText = '';
  openModal('approveCreatorModal');
}

async function handleApproveCreatorSubmit(e) {
  e.preventDefault();
  const reqId = document.getElementById('approveReqId').value;
  const custom_username = document.getElementById('customUsername').value.trim();
  const custom_password = document.getElementById('customPassword').value.trim();
  const msgBox = document.getElementById('approveMsg');

  msgBox.style.color = '#B45309';
  msgBox.innerText = 'मंजुरी दिली जात आहे...';

  try {
    const res = await fetch(`/api/admin/creator-requests/${reqId}/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'approve', custom_username, custom_password })
    });
    const data = await res.json();

    if (data.success) {
      msgBox.style.color = 'green';
      let emailStatus = data.email_dispatched
        ? `✅ ईमेल पाठवला (${data.credentials.email})`
        : `⚠️ ईमेल: ${data.email_info}`;

      msgBox.innerHTML = `✅ मंजुरी यशस्वी!<br/>
        <strong>Username:</strong> ${data.credentials.username}<br/>
        <strong>Password:</strong> ${data.credentials.temporary_password}<br/>
        ${emailStatus}`;

      setTimeout(() => {
        closeModal('approveCreatorModal');
        loadAdminTab('requests');
      }, 3000);
    } else {
      msgBox.style.color = 'red';
      msgBox.innerText = data.message;
    }
  } catch (err) {
    msgBox.style.color = 'red';
    msgBox.innerText = `Error: ${err.message}`;
  }
}

async function processCreatorReq(reqId, action) {
  if (action === 'approve') {
    openApproveModal(reqId);
    return;
  }

  if (!confirm(`आपण हा क्रिएटर अर्ज ${action} करू इच्छिता?`)) return;

  try {
    const res = await fetch(`/api/admin/creator-requests/${reqId}/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action })
    });
    const data = await res.json();
    showToast(data.message, data.success ? 'success' : 'error');
    loadAdminTab('requests');
  } catch (err) {
    showToast('Error: ' + err.message, 'error');
  }
}

async function deleteCreatorRequest(reqId) {
  if (!confirm('हा क्रिएटर अर्ज कायमचा हटवायचा आहे का?')) return;

  try {
    const res = await fetch(`/api/admin/creator-requests/${reqId}/delete`, { method: 'POST' });
    const data = await res.json();
    showToast(data.message, data.success ? 'success' : 'error');
    if (data.success) loadAdminTab('requests');
  } catch (err) {
    showToast('Error: ' + err.message, 'error');
  }
}

async function deleteCreator(creatorId, username) {
  if (!confirm(`क्रिएटर "${username}" ला कायमचे हटवायचे आहे का? हे पूर्ववत होणार नाही.`)) return;

  try {
    const res = await fetch(`/api/admin/creators/${creatorId}/delete`, { method: 'POST' });
    const data = await res.json();
    showToast(data.message, data.success ? 'success' : 'error');
    if (data.success) loadAdminTab('creators');
  } catch (err) {
    showToast('Error: ' + err.message, 'error');
  }
}


// ==========================================
// CONTENT PUBLISH & DELETE
// ==========================================
async function publishContentItem(id) {
  if (!confirm('आपण हे कंटेंट सार्वजनिक (Public) करू इच्छिता?')) return;
  try {
    const res = await fetch(`/api/admin/content/${id}/publish`, { method: 'POST' });
    const data = await res.json();
    showToast(data.message, data.success ? 'success' : 'error');
    if (data.success) { loadAdminTab('drafts'); loadPublicContent(); }
  } catch (err) {
    showToast('Error: ' + err.message, 'error');
  }
}

async function deleteContentItem(id) {
  if (!confirm('आपण हे कंटेंट कायमचे हटवू (Delete) इच्छिता? बॅकअप स्टोरेजमधून पण हटेल.')) return;
  try {
    const res = await fetch(`/api/admin/content/${id}/delete`, { method: 'POST' });
    const data = await res.json();
    showToast(data.message, data.success ? 'success' : 'error');
    if (data.success) { loadAdminTab('drafts'); loadPublicContent(); }
  } catch (err) {
    showToast('Error: ' + err.message, 'error');
  }
}

async function rejectContentItem(id) {
  if (!confirm('आपण हा मजकूर नाकारू (Reject) इच्छिता?')) return;
  try {
    const res = await fetch(`/api/admin/content/${id}/reject`, { method: 'POST' });
    const data = await res.json();
    showToast(data.message, data.success ? 'success' : 'error');
    if (data.success) { loadAdminTab('drafts'); loadPublicContent(); }
  } catch (err) {
    showToast('Error: ' + err.message, 'error');
  }
}


// ==========================================
// BACKUP STORAGE ACTIONS & DRIVE SYNC
// ==========================================
async function syncBackupToDrive(backupId) {
  showToast('Google Drive वर अपलोड सुरू आहे...', 'info');
  try {
    const res = await fetch(`/api/admin/backup-storage/${backupId}/sync-drive`, { method: 'POST' });
    const data = await res.json();
    showToast(data.message, data.success ? 'success' : 'error');
    if (data.success) loadAdminTab('backup');
  } catch (err) {
    showToast('Sync error: ' + err.message, 'error');
  }
}

async function testGoogleScriptConnection() {
  const resultSpan = document.getElementById('gscriptTestResult');
  const btn = document.getElementById('btnTestGScript');
  if (resultSpan) {
    resultSpan.style.color = '#B45309';
    resultSpan.innerText = 'कनेक्शन तपासत आहे... कृपया थांबा...';
  }
  if (btn) btn.disabled = true;

  try {
    const res = await fetch('/api/admin/google-script/test');
    const data = await res.json();
    if (data.success) {
      if (resultSpan) {
        resultSpan.style.color = '#059669';
        resultSpan.innerHTML = `✅ ${data.message}`;
      }
      showToast('Google Apps Script & Google Drive यशस्वीरित्या जोडले गेले आहे!', 'success');
    } else {
      if (resultSpan) {
        resultSpan.style.color = '#DC2626';
        resultSpan.innerHTML = `❌ ${data.message}`;
      }
      showToast('कनेक्शन त्रुटी: ' + data.message, 'error');
    }
  } catch (err) {
    if (resultSpan) {
      resultSpan.style.color = '#DC2626';
      resultSpan.innerText = '❌ Error: ' + err.message;
    }
  } finally {
    if (btn) btn.disabled = false;
  }
}

function copyAppsScriptCode() {
  const codeEl = document.getElementById('appsScriptCodeBlock');
  if (!codeEl) return;
  navigator.clipboard.writeText(codeEl.innerText).then(() => {
    showToast('Google Apps Script कोड क्लिपबोर्डवर कॉपी केला!', 'success');
  }).catch(() => {
    showToast('कृपया मॅन्युअली कोड कॉपी करा.', 'warning');
  });
}

async function updateDriveUrl(backupId) {
  const input = document.getElementById(`driveUrl-${backupId}`);
  if (!input || !input.value.trim()) {
    showToast('कृपया Google Drive URL टाका.', 'warning');
    return;
  }

  try {
    const res = await fetch(`/api/admin/backup-storage/${backupId}/update-drive-url`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ google_drive_url: input.value.trim() })
    });
    const data = await res.json();
    showToast(data.message, data.success ? 'success' : 'error');
    if (data.success) loadAdminTab('backup');
  } catch (err) {
    showToast('Error: ' + err.message, 'error');
  }
}

async function deleteBackupRecord(backupId) {
  if (!confirm('हा बॅकअप रेकॉर्ड हटवायचा आहे का? स्थानिक फाइल पण हटेल.')) return;

  try {
    const res = await fetch(`/api/admin/backup-storage/${backupId}/delete`, { method: 'POST' });
    const data = await res.json();
    showToast(data.message, data.success ? 'success' : 'error');
    if (data.success) loadAdminTab('backup');
  } catch (err) {
    showToast('Error: ' + err.message, 'error');
  }
}


// ==========================================
// ==========================================
// CONTENT SUBMISSION (ADMIN & CREATOR)
// ==========================================
async function uploadMediaInChunks(file, onProgress) {
  const CHUNK_SIZE = 2 * 1024 * 1024; // 2 MB chunks (safely under Vercel's 4.5 MB limit)
  const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
  const uploadId = 'up_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);

  for (let i = 0; i < totalChunks; i++) {
    const start = i * CHUNK_SIZE;
    const end = Math.min(file.size, start + CHUNK_SIZE);
    const chunkBlob = file.slice(start, end);

    const fd = new FormData();
    fd.append('upload_id', uploadId);
    fd.append('chunk_index', i);
    fd.append('total_chunks', totalChunks);
    fd.append('filename', file.name);
    fd.append('mime_type', file.type || 'video/mp4');
    fd.append('chunk_file', chunkBlob, file.name);

    if (onProgress) {
      const pct = Math.round((i / totalChunks) * 100);
      onProgress(pct, i + 1, totalChunks);
    }

    const res = await fetch('/api/upload-chunk', {
      method: 'POST',
      body: fd
    });

    if (!res.ok) {
      let errMsg = `सर्व्हर त्रुटी HTTP ${res.status}`;
      try {
        const errJson = await res.json();
        if (errJson.message) errMsg = errJson.message;
      } catch {}
      throw new Error(errMsg);
    }

    const result = await res.json();
    if (!result.success) {
      throw new Error(result.message || 'चंक अपलोड अयशस्वी झाले.');
    }

    if (result.completed) {
      if (onProgress) onProgress(100, totalChunks, totalChunks);
      return result;
    }
  }

  throw new Error('अपलोड प्रक्रिया पूर्ण झाली नाही.');
}

async function handleContentSubmit(e) {
  e.preventDefault();
  const form = document.getElementById('addContentForm');
  const formData = new FormData(form);
  const msgBox = document.getElementById('submitMsg');
  const fileInput = document.getElementById('mediaFileInput');
  const file = fileInput ? fileInput.files[0] : null;
  const submitBtn = form.querySelector('button[type="submit"]');

  const isVideo = file && (file.type.startsWith('video/') || /\.(mp4|webm|mov|mkv|avi|m4v|3gp|ogg|ogv)$/i.test(file.name));
  const sizeMB = file ? (file.size / (1024 * 1024)).toFixed(1) : 0;

  // Strict 10 MB limit for videos
  if (isVideo && file.size > 10 * 1024 * 1024) {
    msgBox.style.color = '#DC2626';
    msgBox.innerText = `⚠️ निवडलेली व्हिडिओ फाइल ${sizeMB} MB आहे. थेट अपलोडसाठी कमाल मर्यादा १० MB आहे. कृपया व्हिडिओ १० MB पेक्षा लहान करा किंवा YouTube लिंक वापरा.`;
    return;
  }

  // General file size limit (15MB for images/docs)
  if (!isVideo && file && file.size > 15 * 1024 * 1024) {
    msgBox.style.color = '#DC2626';
    msgBox.innerText = `⚠️ फाइल खूप मोठी आहे (${sizeMB} MB). कमाल मर्यादा १५ MB आहे.`;
    return;
  }

  // Add publish_now from checkbox
  const publishCheck = document.getElementById('publishNowCheck');
  if (publishCheck && publishCheck.checked) {
    formData.set('publish_now', 'true');
  }

  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerText = '⏳ प्रक्रिया सुरू आहे...';
  }

  try {
    // If a video or file > 2.5 MB is selected, upload via chunked streaming
    // to bypass Vercel's 4.5 MB request limit and avoid any browser 404/CORS errors!
    const needsChunkedUpload = file && (isVideo || file.size > 2.5 * 1024 * 1024);

    if (needsChunkedUpload) {
      msgBox.style.color = '#B45309';
      msgBox.innerText = `🎬 व्हिडिओ अपलोड सुरू होत आहे (${sizeMB} MB)...`;

      const uploadResult = await uploadMediaInChunks(file, (pct, current, total) => {
        msgBox.innerText = `🎬 व्हिडिओ सुरक्षित सर्व्हर व क्लाउडवर जात आहे (${pct}% - चंक ${current}/${total})... कृपया थांबा.`;
      });

      // Remove binary file from formData so the final submit request is tiny (< 2 KB)
      formData.delete('media_file');
      if (uploadResult && uploadResult.upload_id) {
        formData.set('upload_id', uploadResult.upload_id);
      }
      formData.set('google_drive_url', uploadResult.file_url || '');
      formData.set('media_url', uploadResult.preview_url || uploadResult.direct_url || uploadResult.file_url || '');
      formData.set('media_type', isVideo ? 'video' : 'image');
      formData.set('backup_filename', uploadResult.filename || file.name);
      formData.set('backup_size', (uploadResult.file_size || file.size).toString());

      msgBox.style.color = '#059669';
      msgBox.innerText = '✅ व्हिडिओ सुरक्षित अपलोड झाला! आता माहिती नोंदवली जात आहे...';
    } else {
      msgBox.style.color = '#B45309';
      msgBox.innerText = '📤 मजकूर अपलोड होत आहे...';
    }

    const res = await fetch('/api/content/submit', {
      method: 'POST',
      body: formData
    });

    let data;
    try {
      data = await res.json();
    } catch {
      data = { success: false, message: res.status === 413 ? 'फाइल खूप मोठी आहे (Vercel Payload Limit exceeded).' : `सर्व्हर त्रुटी: HTTP ${res.status}` };
    }

    if (data.success) {
      msgBox.style.color = 'green';
      msgBox.innerText = data.message;
      form.reset();
      const previewEl = document.getElementById('uploadPreview');
      if (previewEl) previewEl.style.display = 'none';
      setTimeout(() => {
        closeModal('addContentModal');
        loadPublicContent();
      }, 1500);
    } else {
      msgBox.style.color = 'red';
      msgBox.innerText = data.message || 'अपलोड अयशस्वी झाले.';
    }
  } catch (err) {
    console.error('Submit error:', err);
    msgBox.style.color = 'red';
    msgBox.innerText = 'अपलोड करताना त्रुटी आली. इंटरनेट तपासा आणि पुन्हा प्रयत्न करा.';
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerText = '📤 कंटेंट सबमिट करा';
    }
  }
}

// Media file preview
function initMediaPreview() {
  const fileInput = document.getElementById('mediaFileInput');
  const preview = document.getElementById('uploadPreview');
  if (!fileInput || !preview) return;

  fileInput.addEventListener('change', () => {
    const file = fileInput.files[0];
    if (!file) { preview.style.display = 'none'; return; }

    preview.style.display = 'block';
    preview.innerHTML = '';

    const isVid = file.type.startsWith('video/') || /\.(mp4|webm|mov|mkv|avi|m4v|3gp|ogg|ogv)$/i.test(file.name);
    const sizeMB = (file.size / (1024 * 1024)).toFixed(1);

    // Immediate check on file selection for 10 MB video limit
    if (isVid && file.size > 10 * 1024 * 1024) {
      preview.innerHTML = `
        <div style="background:#FEE2E2; border:1px solid #FCA5A5; color:#991B1B; padding:0.6rem 0.8rem; border-radius:8px; font-size:0.85rem; line-height:1.4;">
          ⚠️ <strong>व्हिडिओ १० MB पेक्षा जास्त आहे (${sizeMB} MB)</strong><br>
          थेट व्हिडिओ अपलोडसाठी कमाल मर्यादा <strong>१० MB</strong> आहे. कृपया व्हिडिओ कॉम्प्रेश करा किंवा वर <strong>YouTube लिंक</strong> वापरा.
        </div>`;
      fileInput.value = '';
      return;
    }

    if (file.type.startsWith('image/')) {
      const img = document.createElement('img');
      img.style.cssText = 'max-width:100%; max-height:200px; border-radius:8px; border:1px solid var(--brand-border);';
      img.src = URL.createObjectURL(file);
      preview.appendChild(img);
    } else if (file.type.startsWith('video/')) {
      const vid = document.createElement('video');
      vid.controls = true;
      vid.style.cssText = 'max-width:100%; max-height:200px; border-radius:8px;';
      vid.src = URL.createObjectURL(file);
      preview.appendChild(vid);
    } else {
      preview.innerHTML = `<p style="color: var(--brand-brown);">📄 ${file.name} (${(file.size/1024/1024).toFixed(2)} MB)</p>`;
    }
  });
}


// ==========================================
// MODAL CONTROLLERS
// ==========================================
function openModal(id) {
  const modal = document.getElementById(id);
  if (modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }
}


// ==========================================
// TOAST NOTIFICATIONS
// ==========================================
function showToast(message, type = 'info') {
  let toast = document.getElementById('globalToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'globalToast';
    toast.style.cssText = `
      position: fixed; bottom: 1.5rem; right: 1.5rem; z-index: 9999;
      padding: 0.9rem 1.5rem; border-radius: 12px; font-size: 0.9rem;
      font-weight: 600; max-width: 320px; box-shadow: 0 8px 24px rgba(0,0,0,0.15);
      transition: all 0.3s ease; transform: translateY(100px); opacity: 0;
    `;
    document.body.appendChild(toast);
  }

  const colors = {
    success: { bg: '#DCFCE7', color: '#166534' },
    error: { bg: '#FEE2E2', color: '#991B1B' },
    warning: { bg: '#FEF3C7', color: '#92400E' },
    info: { bg: '#EFF6FF', color: '#1E40AF' }
  };

  const style = colors[type] || colors.info;
  toast.style.background = style.bg;
  toast.style.color = style.color;
  toast.innerText = message;
  toast.style.transform = 'translateY(0)';
  toast.style.opacity = '1';

  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => {
    toast.style.transform = 'translateY(100px)';
    toast.style.opacity = '0';
  }, 3500);
}


// ==========================================
// EVENT LISTENERS INIT
// ==========================================
function initEventListeners() {
  document.getElementById('langToggleBtn')?.addEventListener('click', toggleLanguage);
  document.getElementById('creatorRequestForm')?.addEventListener('submit', handleCreatorRequestSubmit);
  document.getElementById('loginForm')?.addEventListener('submit', handleLoginSubmit);
  document.getElementById('addContentForm')?.addEventListener('submit', handleContentSubmit);
  document.getElementById('approveCreatorForm')?.addEventListener('submit', handleApproveCreatorSubmit);

  // Close modal when clicking overlay background
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.classList.remove('active');
        document.body.style.overflow = '';
      }
    });
  });

  // Smooth scroll active nav highlight
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-link');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        navLinks.forEach(link => {
          link.classList.toggle('active', link.getAttribute('href') === '#' + entry.target.id);
        });
      }
    });
  }, { threshold: 0.4 });

  sections.forEach(section => observer.observe(section));
}
