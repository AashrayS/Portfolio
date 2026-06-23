/**
 * Main gamification logic for "The Product Builder's Quest"
 */

document.addEventListener('DOMContentLoaded', () => {
  // Initialize Icons
  lucide.createIcons();

  // --- RESET STATE ON RELOAD ---
  if (history.scrollRestoration) {
    history.scrollRestoration = 'manual';
  }
  window.scrollTo(0, 0);

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

  // --- INTRO GATE (0.5s auto-dismiss) ---
  const introGate = document.getElementById('intro-gate');

  if (introGate) {
    setTimeout(() => {
      introGate.classList.add('hidden');
      document.body.classList.remove('no-scroll');
      setTimeout(() => {
        introGate.style.display = 'none';
        startHeroTyping();
      }, 500);
    }, 500);
  }

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

  // --- ACHIEVEMENTS STUB (for game.js compatibility) ---
  window.checkAchievement = function() {};

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
