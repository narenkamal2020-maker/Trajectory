document.addEventListener('DOMContentLoaded', () => {
    /* ==========================================================================
       Navbar Scroll Effect
       ========================================================================== */
    const navbar = document.getElementById('navbar');
    
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    /* ==========================================================================
       Mobile Menu Toggle (Basic implementation for structure)
       ========================================================================== */
    const mobileToggle = document.querySelector('.mobile-toggle');
    const navLinks = document.querySelector('.nav-links');
    const navActions = document.querySelector('.nav-actions');

    mobileToggle.addEventListener('click', () => {
        // Simple toggle for demonstration. In a production app, this would
        // use a proper mobile menu overlay or dropdown with CSS transitions.
        const isExpanded = navLinks.style.display === 'flex';
        navLinks.style.display = isExpanded ? 'none' : 'flex';
        navLinks.style.flexDirection = 'column';
        navLinks.style.position = 'absolute';
        navLinks.style.top = '100%';
        navLinks.style.left = '0';
        navLinks.style.width = '100%';
        navLinks.style.background = 'var(--bg-glass)';
        navLinks.style.padding = 'var(--space-4)';
        navLinks.style.backdropFilter = 'blur(16px)';
        
        navActions.style.display = isExpanded ? 'none' : 'flex';
        navActions.style.flexDirection = 'column';
        navActions.style.position = 'absolute';
        navActions.style.top = 'calc(100% + 200px)';
        navActions.style.left = '0';
        navActions.style.width = '100%';
        navActions.style.background = 'var(--bg-glass)';
        navActions.style.padding = 'var(--space-4)';
        navActions.style.backdropFilter = 'blur(16px)';
    });

    /* ==========================================================================
       FAQ Accordion
       ========================================================================== */
    const faqItems = document.querySelectorAll('.faq-item');

    faqItems.forEach(item => {
        const toggle = item.querySelector('.faq-toggle');
        const content = item.querySelector('.faq-content');

        toggle.addEventListener('click', () => {
            const isActive = item.classList.contains('active');
            
            // Close all other items
            faqItems.forEach(otherItem => {
                otherItem.classList.remove('active');
                otherItem.querySelector('.faq-content').style.maxHeight = null;
            });

            if (!isActive) {
                item.classList.add('active');
                // Calculate actual height needed
                content.style.maxHeight = content.scrollHeight + "px";
            }
        });
    });

    /* ==========================================================================
       Animations & Interactions (Respecting prefers-reduced-motion)
       ========================================================================== */
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* Hero Canvas Image Sequence */
    const canvas = document.getElementById('hero-canvas');
    if (canvas) {
        try {
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                throw new Error('2D canvas context unavailable');
            }
            const frameCount = 80;
            const currentFrame = (index) => (
                `hero/Career_preparation_transforms_in._202606122054_${index.toString().padStart(3, '0')}.jpg`
            );
            const images = [];
            const loopDuration = 14000;
            const resetBlendDuration = 1200;
            const motionState = { startTime: null, rafId: null, progress: 0 };

            const resizeCanvas = () => {
                const heroSection = canvas.closest('.hero');
                const bounds = heroSection ? heroSection.getBoundingClientRect() : canvas.getBoundingClientRect();
                const dpr = window.devicePixelRatio || 1;
                const targetWidth = Math.max(1, Math.round(bounds.width * dpr));
                const targetHeight = Math.max(1, Math.round(bounds.height * dpr));

                if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
                    canvas.width = targetWidth;
                    canvas.height = targetHeight;
                    canvas.style.width = `${Math.round(bounds.width)}px`;
                    canvas.style.height = `${Math.round(bounds.height)}px`;
                }
            };

            const drawFrame = (img, alpha = 1) => {
                if (!img || !img.complete || img.naturalWidth === 0) {
                    return false;
                }

                const canvasRatio = canvas.width / canvas.height;
                const imageRatio = img.naturalWidth / img.naturalHeight;
                let drawWidth;
                let drawHeight;

                if (imageRatio > canvasRatio) {
                    drawHeight = canvas.height;
                    drawWidth = drawHeight * imageRatio;
                } else {
                    drawWidth = canvas.width;
                    drawHeight = drawWidth / imageRatio;
                }

                const dx = (canvas.width - drawWidth) / 2;
                const dy = (canvas.height - drawHeight) / 2;

                ctx.save();
                ctx.globalAlpha = alpha;
                ctx.drawImage(img, dx, dy, drawWidth, drawHeight);
                ctx.restore();
                return true;
            };

            const renderFrame = (progress = 0) => {
                const normalized = ((progress % 1) + 1) % 1;
                motionState.progress = normalized;
                const framePosition = normalized * (frameCount - 1);
                const frameIndex = Math.floor(framePosition);
                const nextIndex = Math.min(frameIndex + 1, frameCount - 1);
                const mix = framePosition - frameIndex;

                ctx.clearRect(0, 0, canvas.width, canvas.height);

                const baseDrawn = drawFrame(images[frameIndex], 1 - mix * 0.35);
                const nextImage = nextIndex === frameIndex ? images[frameIndex] : images[nextIndex];
                const nextDrawn = drawFrame(nextImage, nextIndex === frameIndex ? 0 : mix);

                if (!baseDrawn && !nextDrawn) {
                    drawFrame(images[0], 1);
                }
            };

            const animateSequence = (timestamp) => {
                if (motionState.startTime === null) {
                    motionState.startTime = timestamp;
                }

                const totalLoop = loopDuration + resetBlendDuration;
                const elapsed = (timestamp - motionState.startTime) % totalLoop;

                if (elapsed <= loopDuration) {
                    renderFrame(elapsed / loopDuration);
                } else {
                    const blendProgress = (elapsed - loopDuration) / resetBlendDuration;
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    drawFrame(images[frameCount - 1], 1 - blendProgress);
                    drawFrame(images[0], blendProgress);
                }

                motionState.rafId = window.requestAnimationFrame(animateSequence);
            };

            for (let i = 0; i < frameCount; i++) {
                const img = new Image();
                img.src = currentFrame(i);
                if (typeof img.decode === 'function') {
                    img.decode().catch(() => {});
                }
                images.push(img);
            }

            const firstFrame = images[0];
            const paintInitialFrame = () => {
                resizeCanvas();
                renderFrame(motionState.progress);
            };

            if (firstFrame.complete && firstFrame.naturalWidth > 0) {
                paintInitialFrame();
            } else {
                firstFrame.addEventListener('load', paintInitialFrame, { once: true });
            }

            window.addEventListener('resize', () => {
                resizeCanvas();
                renderFrame(motionState.progress);
            });

            resizeCanvas();

            if (!prefersReducedMotion) {
                motionState.rafId = window.requestAnimationFrame(animateSequence);
            } else {
                paintInitialFrame();
            }
        } catch (e) {
            console.error("Hero canvas error:", e);
        }
    }

    if (!prefersReducedMotion) {
        // Initial fade-in for hero elements
        setTimeout(() => {
            document.querySelectorAll('.fade-in-up').forEach(el => el.classList.add('visible'));
        }, 100);

        // Magnetic Buttons
        const magneticButtons = document.querySelectorAll('.magnetic');
        
        magneticButtons.forEach(btn => {
            btn.addEventListener('mousemove', (e) => {
                const rect = btn.getBoundingClientRect();
                const x = e.clientX - rect.left - rect.width / 2;
                const y = e.clientY - rect.top - rect.height / 2;
                
                btn.style.transform = `translate(${x * 0.2}px, ${y * 0.2}px)`;
            });
            
            btn.addEventListener('mouseleave', () => {
                btn.style.transform = 'translate(0px, 0px)';
            });
        });

        // GSAP ScrollTrigger Animations
        if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
            gsap.registerPlugin(ScrollTrigger);

            const revealElements = document.querySelectorAll('.scroll-reveal');
            
            revealElements.forEach(el => {
                gsap.to(el, {
                    scrollTrigger: {
                        trigger: el,
                        start: "top 85%", // Reveal when element top hits 85% of viewport height
                        toggleActions: "play none none none"
                    },
                    opacity: 1,
                    y: 0,
                    duration: 0.8,
                    ease: "power3.out"
                });
            });

            // Pipeline node highlight sequence
            const nodes = document.querySelectorAll('.node');
            if (nodes.length > 0) {
                gsap.to('.pipeline-line', {
                    scrollTrigger: {
                        trigger: '.pipeline-graphic',
                        start: "top 70%",
                        end: "bottom 30%",
                        scrub: 1
                    },
                    background: "linear-gradient(to right, var(--accent-emerald), var(--accent-emerald))",
                });
            }
        }
    } else {
        // If reduced motion is preferred, immediately show all elements
        document.querySelectorAll('.scroll-reveal').forEach(el => {
            el.style.opacity = 1;
            el.style.transform = 'none';
        });
        document.querySelectorAll('.fade-in-up').forEach(el => {
            el.style.opacity = 1;
            el.style.transform = 'none';
        });
    }
});
