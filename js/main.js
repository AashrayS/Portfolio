/**
 * Main gamification logic for "The Product Builder's Quest"
 */

document.addEventListener('DOMContentLoaded', () => {
  // Initialize Icons
  lucide.createIcons();

  // --- DRAW PIXEL BOT AVATAR ---
  const avatarCanvas = document.getElementById('guide-avatar-canvas');
  if (avatarCanvas) {
    const ctx = avatarCanvas.getContext('2d');
    const p = 6; // pixel size for 60x60 canvas (10x12 grid)
    const offsetX = 0;
    const offsetY = -6; // center slightly
    
    const G = '#CCFF00'; // neon green (body)
    const D = '#1B1464'; // dark indigo
    const W = '#FFFFFF'; // white (eyes)
    const O = '#FF6B35'; // orange
    const _ = null;
    
    const sprite = [
      [_,_,_,D,D,D,D,_,_,_],
      [_,_,D,G,G,G,G,D,_,_],
      [_,D,G,G,G,G,G,G,D,_],
      [_,D,W,D,G,G,W,D,D,_],
      [_,D,G,G,G,G,G,G,D,_],
      [_,_,D,G,D,D,G,D,_,_],
      [_,_,_,D,D,D,D,_,_,_],
      [_,D,D,O,O,O,O,D,D,_],
      [D,G,D,O,O,O,O,D,G,D],
      [D,G,D,O,O,O,O,D,G,D],
      [_,_,D,D,_,_,D,D,_,_],
      [_,D,D,_,_,_,_,D,D,_],
    ];
    
    for (let r = 0; r < sprite.length; r++) {
      for (let c = 0; c < sprite[r].length; c++) {
        if (sprite[r][c]) {
          ctx.fillStyle = sprite[r][c];
          ctx.fillRect(offsetX + c * p, offsetY + r * p, p, p);
        }
      }
    }
  }

  // --- RESET STATE ON RELOAD ---
  if (history.scrollRestoration) {
    history.scrollRestoration = 'manual';
  }
  window.scrollTo(0, 0);
  localStorage.removeItem('as_achievements');

  // --- MOBILE NAV TOGGLE ---
  const navToggle = document.getElementById('nav-toggle');
  const mobileMenu = document.getElementById('mobile-menu');
  if (navToggle && mobileMenu) {
    navToggle.addEventListener('click', () => {
      mobileMenu.classList.toggle('active');
    });
    // Close mobile menu when a link is clicked
    mobileMenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        mobileMenu.classList.remove('active');
      });
    });
  }

  // --- NAVBAR SCROLL EFFECT ---
  const navbar = document.getElementById('navbar');
  window.addEventListener('scroll', () => {
    if(window.scrollY > 50) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  });

  // --- AUDIO SYSTEM (Web Audio API for retro sounds) ---
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  let audioCtx;
  let soundEnabled = false;

  function initAudio() {
    if (!audioCtx) {
      audioCtx = new AudioContext();
    }
  }

  function playTone(freq, type, duration, vol) {
    if (!soundEnabled || !audioCtx) return;
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime);
    
    gainNode.gain.setValueAtTime(vol, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
    
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + duration);
  }

  const sfx = {
    click: () => playTone(600, 'square', 0.1, 0.1),
    hover: () => playTone(800, 'sine', 0.05, 0.05),
    levelUp: () => {
      if(!soundEnabled) return;
      playTone(400, 'square', 0.1, 0.1);
      setTimeout(() => playTone(600, 'square', 0.1, 0.1), 100);
      setTimeout(() => playTone(800, 'square', 0.2, 0.1), 200);
    },
    achievement: () => {
      if(!soundEnabled) return;
      playTone(500, 'sine', 0.1, 0.1);
      setTimeout(() => playTone(1000, 'sine', 0.3, 0.1), 100);
    },
    secret: () => {
      if(!soundEnabled) return;
      playTone(300, 'sawtooth', 0.2, 0.1);
      setTimeout(() => playTone(400, 'sawtooth', 0.2, 0.1), 200);
      setTimeout(() => playTone(500, 'sawtooth', 0.4, 0.1), 400);
    },
    jump: () => {
      if(!soundEnabled) return;
      playTone(300, 'sine', 0.1, 0.2);
    },
    error: () => {
      if(!soundEnabled) return;
      playTone(150, 'sawtooth', 0.2, 0.4);
      setTimeout(() => playTone(100, 'sawtooth', 0.3, 0.4), 150);
    },
    collect: () => {
      if(!soundEnabled) return;
      playTone(900, 'sine', 0.08, 0.08);
    }
  };
  window.sfx = sfx;

  const soundToggle = document.getElementById('sound-toggle');
  const iconOff = document.getElementById('sound-icon-off');
  const iconOn = document.getElementById('sound-icon-on');

  soundToggle.addEventListener('click', () => {
    soundEnabled = !soundEnabled;
    if (soundEnabled) {
      initAudio();
      if(audioCtx.state === 'suspended') audioCtx.resume();
      iconOff.style.display = 'none';
      iconOn.style.display = 'block';
      sfx.click();
    } else {
      iconOff.style.display = 'block';
      iconOn.style.display = 'none';
    }
  });

  // --- INTRO GATE ---
  const introGate = document.getElementById('intro-gate');
  const btnStart = document.getElementById('btn-start');
  const introText = document.getElementById('intro-text');
  
  const typeIntro = async () => {
    const text = "System initialized.\nLoading 'Aashray.exe'...\nReady to begin quest.";
    for (let i = 0; i < text.length; i++) {
      introText.textContent += text[i];
      if(text[i] !== ' ') sfx.hover();
      await new Promise(r => setTimeout(r, 40));
    }
  };
  
  setTimeout(typeIntro, 500);

  btnStart.addEventListener('click', () => {
    initAudio();
    sfx.levelUp();
    introGate.classList.add('hidden');
    document.body.classList.remove('no-scroll');
    setTimeout(() => {
      introGate.style.display = 'none';
      startHeroTyping();
      checkAchievement('first_blood');
    }, 800);
  });

  // --- TYPEWRITER EFFECTS ---
  function typeText(elementId, text, speed = 50) {
    const el = document.getElementById(elementId);
    if(!el) return;
    el.textContent = '';
    let i = 0;
    function type() {
      if (i < text.length) {
        el.textContent += text.charAt(i);
        i++;
        setTimeout(type, speed);
      }
    }
    type();
  }

  function startHeroTyping() {
    typeText('hero-title-type', "Strategy. Product.\nGrowth.", 60);
  }

  // --- CHARACTER GUIDE & XP BAR ---
  const sections = document.querySelectorAll('.lvl-section');
  const xpFill = document.getElementById('xp-bar-fill');
  const xpCounter = document.getElementById('xp-counter');
  const levelNameEl = document.getElementById('current-level-name');
  
  const charGuide = document.getElementById('character-guide');
  const speechBubble = document.getElementById('speech-bubble');
  const speechText = document.getElementById('speech-text');
  const sprite = document.getElementById('character-sprite');
  
  let currentLevel = 0;
  const maxXP = 1000;
  let speechTimeout;

  sprite.addEventListener('click', () => {
    sfx.click();
    sprite.classList.add('bounce');
    setTimeout(() => sprite.classList.remove('bounce'), 500);
  });

  function showSpeech(text) {
    sfx.levelUp();
    clearTimeout(speechTimeout);
    
    charGuide.classList.add('active'); // Slide in
    speechBubble.classList.add('active');
    
    // Set text instantly for maximum readability
    speechText.innerHTML = text;

    speechTimeout = setTimeout(() => {
      speechBubble.classList.remove('active');
      charGuide.classList.remove('active'); // Slide out
    }, 5000);
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const level = parseInt(entry.target.getAttribute('data-level'));
        const name = entry.target.getAttribute('data-level-name');
        
        if (level > currentLevel) {
          currentLevel = level;
          
          let msgs = [
            `I'm ready! Let's build.`,
            `Level 2! Check out my origin story.`,
            `Level 3! Inspect the skill tree.`,
            `Level 4! These are my active quests.`,
            `Level 5! The journey map.`
          ];
          showSpeech(`Level ${level} Unlocked!<br>${msgs[level-1] || ''}`);
          
          levelNameEl.textContent = `Lvl ${level}: ${name}`;
          
          const progress = (level / sections.length) * 100;
          xpFill.style.height = `${progress}%`;
          
          let currentXpVal = Math.floor((maxXP / sections.length) * level);
          xpCounter.textContent = `${currentXpVal} / ${maxXP} XP`;
          
          if(level === sections.length) {
            checkAchievement('game_complete');
          }
        }
      }
    });
  }, { threshold: 0.3 });

  sections.forEach(section => observer.observe(section));

  // --- ACHIEVEMENTS SYSTEM ---
  const achievements = {
    first_blood: { id: 'first_blood', name: 'Press Start', desc: 'Started the journey', icon: 'play' },
    skill_master: { id: 'skill_master', name: 'Skill Master', desc: 'Explored the skill tree', icon: 'book' },
    quest_hunter: { id: 'quest_hunter', name: 'Quest Hunter', desc: 'Flipped a quest card', icon: 'sword' },
    game_complete: { id: 'game_complete', name: 'Contact Unlocked', desc: 'Reached the contact section', icon: 'flag' },
    konami: { id: 'konami', name: 'Hacker', desc: 'Entered the secret code', icon: 'terminal' }
  };

  let unlocked = JSON.parse(localStorage.getItem('as_achievements') || '[]');
  const trayList = document.getElementById('tray-list');
  const countText = document.getElementById('achievement-count-text');
  const progressFill = document.getElementById('achievement-progress-fill');
  
  const questsLoader = document.getElementById('quests-loader-bar');
  const questsExpandBtn = document.getElementById('quests-expand-btn');

  questsExpandBtn.addEventListener('click', () => {
    sfx.click();
    questsLoader.classList.toggle('collapsed');
  });

  function renderAchievements() {
    trayList.innerHTML = '';
    let count = 0;
    const total = Object.keys(achievements).length;
    
    Object.values(achievements).forEach(ach => {
      const isUnlocked = unlocked.includes(ach.id);
      if(isUnlocked) count++;
      
      const el = document.createElement('div');
      el.className = `achievement-item ${isUnlocked ? 'unlocked' : ''}`;
      el.innerHTML = `
        <div class="ach-header">
          <div class="ach-icon-small"><i data-lucide="${ach.icon}"></i></div>
          <span>${isUnlocked ? ach.name : '???'}</span>
        </div>
      `;
      trayList.appendChild(el);
    });
    
    countText.textContent = `${count}/${total}`;
    progressFill.style.height = `${(count / total) * 100}%`;
    
    lucide.createIcons();
  }

  function checkAchievement(id) {
    if (!unlocked.includes(id)) {
      unlocked.push(id);
      localStorage.setItem('as_achievements', JSON.stringify(unlocked));
      sfx.achievement();
      renderAchievements();
      
      showSpeech(`🏆 ACHIEVEMENT UNLOCKED!<br>${achievements[id].name}`);
    }
  }
  window.checkAchievement = checkAchievement;

  renderAchievements();



  // --- SKILL TREE ---
  const canvas = document.getElementById('tree-lines');
  const treeContainer = document.querySelector('.skill-tree-container');
  const nodes = document.querySelectorAll('.tree-node');
  const centerNode = document.querySelector('.node-center');
  const infoTitle = document.getElementById('tree-info-title');
  const infoDesc = document.getElementById('tree-info-desc');

  function drawLines() {
    if(!canvas || !treeContainer) return;
    canvas.width = treeContainer.clientWidth;
    canvas.height = treeContainer.clientHeight;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const centerRect = centerNode.getBoundingClientRect();
    const containerRect = treeContainer.getBoundingClientRect();
    
    const cx = centerRect.left - containerRect.left + centerRect.width/2;
    const cy = centerRect.top - containerRect.top + centerRect.height/2;

    nodes.forEach(node => {
      if(node === centerNode) return;
      const rect = node.getBoundingClientRect();
      const nx = rect.left - containerRect.left + rect.width/2;
      const ny = rect.top - containerRect.top + rect.height/2;
      
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(nx, ny);
      ctx.strokeStyle = 'rgba(255,255,255,0.2)';
      if(node.classList.contains('active')) {
        ctx.strokeStyle = '#CCFF00';
        ctx.lineWidth = 2;
      } else {
        ctx.lineWidth = 1;
      }
      ctx.stroke();
    });
  }

  if(canvas) {
    window.addEventListener('resize', drawLines);
    setTimeout(drawLines, 500); // initial draw
    
    let nodesHovered = 0;
    const infoPanel = document.getElementById('tree-info');
    
    nodes.forEach(node => {
      node.addEventListener('mouseenter', () => {
        sfx.hover();
        nodes.forEach(n => n.classList.remove('active'));
        node.classList.add('active');
        infoTitle.textContent = node.getAttribute('data-title');
        infoDesc.textContent = node.getAttribute('data-desc');
        drawLines();
        
        // Position panel aside the node
        const rect = node.getBoundingClientRect();
        const containerRect = treeContainer.getBoundingClientRect();
        const nx = rect.left - containerRect.left + rect.width / 2;
        const ny = rect.top - containerRect.top + rect.height;
        infoPanel.style.left = nx + 'px';
        infoPanel.style.top = ny + 'px';
        infoPanel.classList.add('active');
        
        nodesHovered++;
        if(nodesHovered >= 3 && window.checkAchievement) checkAchievement('skill_master');
      });
      
      node.addEventListener('mouseleave', () => {
        infoPanel.classList.remove('active');
        node.classList.remove('active');
        drawLines();
      });
    });
  }

  // --- QUEST CARDS ---
  const cards = document.querySelectorAll('.quest-card');
  cards.forEach(card => {
    card.addEventListener('click', () => {
      sfx.click();
      card.classList.toggle('flipped');
      checkAchievement('quest_hunter');
    });
  });

  // --- 3D TILT EFFECT ---
  const tiltElements = document.querySelectorAll('.tilt-effect');
  tiltElements.forEach(el => {
    el.addEventListener('mousemove', e => {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateX = ((y - centerY) / centerY) * -10;
      const rotateY = ((x - centerX) / centerX) * 10;
      el.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
    });
    el.addEventListener('mouseleave', () => {
      el.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
    });
  });

  // --- KONAMI CODE ---
  const konamiCode = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
  let konamiIndex = 0;
  const modal = document.getElementById('konami-modal');
  const modalClose = document.getElementById('modal-close');

  document.addEventListener('keydown', (e) => {
    if (e.key === konamiCode[konamiIndex]) {
      konamiIndex++;
      if (konamiIndex === konamiCode.length) {
        sfx.secret();
        modal.classList.add('active');
        checkAchievement('konami');
        konamiIndex = 0;
      }
    } else {
      konamiIndex = 0;
    }
  });

  modalClose.addEventListener('click', () => {
    modal.classList.remove('active');
    sfx.click();
  });

  // --- PARTICLES CURSOR ---
  const pCanvas = document.createElement('canvas');
  pCanvas.id = 'particles-canvas';
  document.body.appendChild(pCanvas);
  const pCtx = pCanvas.getContext('2d');
  
  let particles = [];
  let mouse = { x: 0, y: 0 };

  function resizeCanvas() {
    pCanvas.width = window.innerWidth;
    pCanvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    
    // Add particle
    if(Math.random() > 0.5) {
      particles.push({
        x: mouse.x,
        y: mouse.y,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        size: Math.random() * 3 + 1,
        life: 1
      });
    }
  });

  window.addEventListener('click', () => {
    // Burst
    for(let i=0; i<10; i++) {
      particles.push({
        x: mouse.x,
        y: mouse.y,
        vx: (Math.random() - 0.5) * 10,
        vy: (Math.random() - 0.5) * 10,
        size: Math.random() * 4 + 2,
        life: 1
      });
    }
  });

  function animateParticles() {
    pCtx.clearRect(0, 0, pCanvas.width, pCanvas.height);
    
    for(let i = 0; i < particles.length; i++) {
      let p = particles[i];
      pCtx.fillStyle = `rgba(204, 255, 0, ${p.life})`;
      pCtx.beginPath();
      pCtx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      pCtx.fill();
      
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 0.02;
      
      if(p.life <= 0) {
        particles.splice(i, 1);
        i--;
      }
    }
    requestAnimationFrame(animateParticles);
  }
  animateParticles();

  // --- REVEAL ANIMATIONS ON SCROLL ---
  const revealElements = document.querySelectorAll('.reveal');
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if(entry.isIntersecting) {
        entry.target.classList.add('active');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });
  
  revealElements.forEach(el => revealObserver.observe(el));

  // --- CAREER LADDER SCROLL ANIMATION ---
  const ladderContainer = document.querySelector('.career-ladder-container');
  const careerSprite = document.getElementById('career-sprite');
  const ladderWrapper = document.querySelector('.ladder-graphic-wrapper');
  if (ladderContainer && careerSprite) {
    let ticking = false;
    window.addEventListener('scroll', () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const rect = ladderContainer.getBoundingClientRect();
          const windowHeight = window.innerHeight;
          
          const nodes = ladderContainer.querySelectorAll('.ladder-node');
          if (nodes.length > 0) {
            const firstNode = nodes[0];
            const lastNode = nodes[nodes.length - 1];
            
            const firstNodeRect = firstNode.getBoundingClientRect();
            const lastNodeRect = lastNode.getBoundingClientRect();
            
            // Calculate progress based on viewport-relative target line (center of viewport)
            const viewportTarget = windowHeight * 0.5;
            let progress = 0;
            
            if (firstNodeRect.top <= viewportTarget && lastNodeRect.top >= viewportTarget) {
              progress = (viewportTarget - firstNodeRect.top) / (lastNodeRect.top - firstNodeRect.top);
            } else if (lastNodeRect.top < viewportTarget) {
              progress = 1;
            } else {
              progress = 0;
            }
            
            // Size the ladder rails to end cleanly just after the last node
            if (ladderWrapper) {
              const distanceToBottom = rect.bottom - lastNodeRect.bottom;
              ladderWrapper.style.bottom = `${distanceToBottom + 20}px`;
            }
            
            const wrapperTopOffset = 100; // matching CSS top: 100px
            const spriteHeightOffset = 28; // half of 56px sprite height
            
            const firstNodeCenter = (firstNodeRect.top + firstNodeRect.height / 2) - rect.top - wrapperTopOffset - spriteHeightOffset;
            const lastNodeCenter = (lastNodeRect.top + lastNodeRect.height / 2) - rect.top - wrapperTopOffset - spriteHeightOffset;
            
            const spriteTop = firstNodeCenter + progress * (lastNodeCenter - firstNodeCenter);
            careerSprite.style.transform = `translateY(${spriteTop}px)`;
          }
          
          ticking = false;
        });
        ticking = true;
      }
    });
  }


  // --- VIEW MORE TOGGLE ---
  const viewMoreLinks = document.querySelectorAll('.view-more-link');
  viewMoreLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const node = e.target.closest('.ladder-node');
      if (node) {
        node.classList.toggle('expanded');
        if (node.classList.contains('expanded')) {
          e.target.textContent = 'View less ⌃';
        } else {
          e.target.textContent = 'View more ⌄';
        }
      }
    });
  });

});
