// List of technical debt (original_width & original_height are fixed)

document.addEventListener('DOMContentLoaded', () => {
    // Overlay Management
    const overlay = document.getElementById('welcomeOverlay');
    const startButton = document.getElementById('startButton');
    
    startButton.addEventListener('click', () => {
        overlay.classList.add('hiding');
        setTimeout(() => {
            overlay.style.display = 'none';
            const game = new ConstellationGame(constellationData);
        }, 50);
    });
});

class ConstellationGame {
    constructor(data) {
        this.constellations = data.constellations
        this.contentDiv = document.getElementById('content');
        this.nextButton = document.getElementById('nextLevel');

        // Initialisiere Zustände
        this.initializeStates();
        
        // Versuche gespeicherten Spielstand zu laden oder starte neu
        if (this.loadGameState()) {
            // Wenn Spielstand geladen wurde, zeige aktuelles Level
            this.showCurrentState();
        } else {
            // Wenn kein Spielstand, starte neues Spiel
            this.initializeGame();
        }
    }

    // Initialisierung der Grundzustände
    initializeStates() {
        this.currentConstellationIndex = 0;
        this.constellation = this.constellations[0];
        this.currentLevel = 0;
        
        this.constellationStates = {};
        this.constellations.forEach(constellation => {
            this.constellationStates[constellation.id] = {
                visible: false,
                completed: false
            };
        });

        this.initializeHintStates();
    }

    // Speichern des Spielstands
    saveGameState() {
        const gameState = {
            currentConstellationIndex: this.currentConstellationIndex,
            constellationStates: this.constellationStates,
            lastSaved: new Date().toISOString()
        };
        localStorage.setItem('constellationGameState', JSON.stringify(gameState));
        console.log('Spielstand gespeichert:', gameState);
    }

    // Laden des Spielstands
    loadGameState() {
        const savedState = localStorage.getItem('constellationGameState');
        if (savedState) {
            const state = JSON.parse(savedState);
            this.currentConstellationIndex = state.currentConstellationIndex;
            this.constellationStates = state.constellationStates;
            
            if(this.currentConstellationIndex < this.constellations.length) {
                this.currentLevel = 1;
                this.constellation = this.constellations[this.currentConstellationIndex];
                this.initializeHintStates();
            } else {
                // Setze Zustände für Completion
                this.currentLevel = 99;
            }
            
            console.log('Spielstand geladen:', state);
            return true;
        }
        return false;
    }

    // Zeige aktuellen Spielstand
    showCurrentState() {
        this.contentDiv.innerHTML = ''; // Clear current content

        if(this.currentLevel === 99){
            this.showCompletionScreen()
            return;
        }
        
        // Button-Event wieder anhängen
        this.nextButton.addEventListener('click', () => this.handleNextLevel());
        
        // Aktuelles Level anzeigen
        // Wichtig: Erst content generieren, dann Handler attachen
        const content = this.generateLevelContent();
        this.contentDiv.innerHTML = content;

        // Warte bis DOM aktualisiert ist
        setTimeout(() => {
            this.attachLevelHandlers();
        }, 100);
    }

    generateLevelContent() {
        let content = '';
        switch(this.currentLevel) {
            case 1:
                content = this.createLevel1();
                break;
            case 2:
                content = this.createLevel2();
                break;
            case 3:
                content = this.createLevel3();
                break;
            case 4:
                content = this.createLevel4();
                break;
        }
        return content;
    }

    attachLevelHandlers() {
        if (this.currentLevel >= 1) {
            this.initializeStarmap();
        }

        if (this.currentLevel >= 2) {
            this.attachHintListeners();
        }

        if (this.currentLevel === 3) {
            const overlaysContainer = document.getElementById('constellationOverlays');
            if (overlaysContainer) {
                this.updateConstellationOverlays();
            } else {
                console.warn('Overlays Container noch nicht bereit');
            }
        }

        // Cards sichtbar machen
        const newCards = document.querySelectorAll('.card:not(.visible)');
        newCards.forEach(card => card.classList.add('visible'));
    }

    initializeGame() {
        this.nextButton.addEventListener('click', () => this.handleNextLevel());
        this.currentLevel = 1;
        this.showLevel();
    }

    // Erster Hinweis zunächst sichtbar, zwei und drei gesperrt.
    initializeHintStates() {
        this.hintStates = {
            0: 'revealed',
            1: 'locked',
            2: 'locked'
        };
    }

    // Nächste Stufe im selben Sternenbild
    handleNextLevel() {
        if (this.currentLevel < 4) {
            this.currentLevel++;
            this.showLevel();
        } else if (this.currentLevel === 4) {
            this.moveToNextConstellation();
            this.saveGameState();  
        }
    }

    showLevel() {
        // Prüfe ob Level 3 bereits existiert (irgendwie wird es doppelt erstellt)
        if (this.currentLevel === 3 && this.contentDiv.querySelector('.l3')) {
            //console.log('Level 3 bereits vorhanden, überspringe Erstellung');
            return;
        }

        const content = this.generateLevelContent();
        this.contentDiv.innerHTML += content;

        if (this.currentLevel >= 1) {
            setTimeout(() => {
                this.initializeStarmap();
            }, 100);
        }

        if (this.currentLevel >= 2) {
            this.attachHintListeners();
        }

        if (this.currentLevel === 3) {
            this.updateConstellationOverlays();
        }

        // Alle neuen Cards für dieses Level sichtbar machen
        setTimeout(() => {
            this.attachLevelHandlers();
        }, 100);
    }

// --- Challenge

    createLevel1() {
        this.nextButton.innerHTML = "Hinweise 👋"

        const aliasName = this.constellation.alias 
        ? `<div class="constellation-alias">Alias<br>${this.constellation.alias}</div>`
        : '';

        return `
            <div class="card">
                ${this.showProgress()}
                <div class="constellation-title-wrapper">
                    <div class="constellation-subtitle">Sternbild</div>
                    <h2 class="constellation-title">${this.constellation.name}</h2>
                    ${aliasName}
                    <div class="constellation-subtitle">Schwierigkeitsgrad: ${this.constellation.difficulty}</div>
                </div>
                <div class="puzzle-text">${this.constellation.puzzle.text}</div>
            </div>

            <div class="card starmap-card">
                <div class="starmap-container">
                    <div class="starmap-controls">
                        <button class="zoom-button" data-zoom="in">
                            <span class="zoom-icon">🔍</span>
                        </button>
                        <button class="zoom-button" data-zoom="out">
                            <span class="zoom-icon">-</span>
                        </button>
                        <button class="zoom-button" data-zoom="reset">
                            <span class="zoom-icon">↺</span>
                        </button>
                    </div>
                    <div class="starmap-controls-left">
                        <button class="select-mode-button" id="selectionModeBtn" title="Sternbild markieren">
                            <span class="select-icon">🎯</span>
                        </button>
                    </div>
                    <div class="starmap-wrapper" id="starmapWrapper">
                        <div class="starmap-layers" id="starmapLayers">
                            <!-- Basis-Sternenkarte -->
                            <img 
                                src="./assets/starmap.png" 
                                alt="Sternenkarte"
                                class="starmap-image"
                                id="starmapImage"
                            >
                            <!-- Container für SVG Overlays -->
                            <div class="constellation-overlays" id="constellationOverlays">
                                ${this.createConstellationOverlays()}
                            </div>
                        </div>
                        <div class="selection-overlay" id="selectionOverlay" style="display: none">
                            <div class="selection-box" id="selectionBox"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // Sternenkarte mit Zoom-Funktionalität
    initializeStarmap() {
        const wrapper = document.getElementById('starmapWrapper');
        const image = document.getElementById('starmapImage');
        const layers = document.getElementById('starmapLayers');
        const zoomButtons = document.querySelectorAll('.zoom-button');
        
        let scale = 1;
        let panning = false;
        let pointX = 0;
        let pointY = 0;
        let lastX, lastY;
        let rafId = null;

        // Selection Mode
        let isSelectionMode = false;
        let isDrawing = false;
        let startX, startY;
        const maxArea_rel = 0.05 // 5% der Kartenfläche
        const selectionModeBtn = document.getElementById('selectionModeBtn');
        const selectionOverlay = document.getElementById('selectionOverlay');
        const selectionBox = document.getElementById('selectionBox');
    
        function updateImageTransform() {
            requestAnimationFrame(() => {
                // Nur eine Transformation auf den äußeren Container
                const transform = `matrix(${scale}, 0, 0, ${scale}, ${pointX}, ${pointY})`;
                layers.style.transform = transform;
            });
        }
        
        // Zoom-Buttons
        zoomButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const action = button.dataset.zoom;
                switch(action) {
                    case 'in':
                        scale *= 1.2;
                        break;
                    case 'out':
                        scale = Math.max(1, scale / 1.2);
                        break;
                    case 'reset':
                        scale = 1;
                        pointX = 0;
                        pointY = 0;
                        break;
                }
                updateImageTransform();
            });
        });
            
        // Mouse Events
        wrapper.addEventListener('mousedown', handleDragStart);
        wrapper.addEventListener('mousemove', handleDragMove);
        wrapper.addEventListener('mouseup', handleDragEnd);
        wrapper.addEventListener('mouseleave', handleDragEnd);
        
        // Touch Events
        wrapper.addEventListener('touchstart', handleTouchStart, { passive: false });
        wrapper.addEventListener('touchmove', handleTouchMove, { passive: false });
        wrapper.addEventListener('touchend', handleDragEnd);
        wrapper.addEventListener('touchcancel', handleDragEnd);
    
        // Gemeinsame Drag-Funktionen
        function handleDragStart(e) {
            e.preventDefault();
            panning = true;
            lastX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
            lastY = e.type.includes('mouse') ? e.clientY : e.touches[0].clientY;
            wrapper.style.cursor = 'grabbing';
        }
    
        function handleDragMove(e) {
            if (!panning) return;
            
            e.preventDefault();
            const clientX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
            const clientY = e.type.includes('mouse') ? e.clientY : e.touches[0].clientY;
            
            const deltaX = clientX - lastX;
            const deltaY = clientY - lastY;
            
            pointX += deltaX;
            pointY += deltaY;
            
            lastX = clientX;
            lastY = clientY;
            
            if (rafId) cancelAnimationFrame(rafId);
            rafId = requestAnimationFrame(() => {
                updateImageTransform();
                rafId = null;
            });
        }
    
        function handleDragEnd() {
            panning = false;
            wrapper.style.cursor = 'grab';
        }
    
        // Spezifische Touch-Handler
        function handleTouchStart(e) {
            if (e.touches.length === 1) {
                handleDragStart(e);
            } else if (e.touches.length === 2) {
                // Pinch-to-zoom Start
                const touch1 = e.touches[0];
                const touch2 = e.touches[1];
                lastPinchDistance = getPinchDistance(touch1, touch2);
            }
        }
    
        function handleTouchMove(e) {
            e.preventDefault(); // Verhindert Scrolling der Seite
            if (e.touches.length === 1) {
                handleDragMove(e);
            } else if (e.touches.length === 2) {
                // Pinch-to-zoom
                const touch1 = e.touches[0];
                const touch2 = e.touches[1];
                const currentDistance = getPinchDistance(touch1, touch2);
                
                if (lastPinchDistance) {
                    const delta = currentDistance - lastPinchDistance;
                    if (Math.abs(delta) > 1) {
                        const newScale = scale * (1 + delta / 100);
                        scale = Math.min(Math.max(1, newScale), 5);
                        updateImageTransform();
                    }
                }
                lastPinchDistance = currentDistance;
            }
        }
    
        // Hilfsfunktion für Pinch-to-zoom
        let lastPinchDistance = null;
        function getPinchDistance(touch1, touch2) {
            return Math.hypot(
                touch1.clientX - touch2.clientX,
                touch1.clientY - touch2.clientY
            );
        }
        
        // Zoom mit Mausrad
        wrapper.addEventListener('wheel', (e) => {
            e.preventDefault();
            const rect = wrapper.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;
            const oldScale = scale;
            
            if (e.deltaY < 0) {
                scale = Math.min(scale * 1.1, 5);
            } else {
                scale = Math.max(1, scale / 1.1);
            }
            
            if (scale !== oldScale) {
                const scaleChange = scale - oldScale;
                pointX -= mouseX * (scaleChange / oldScale);
                pointY -= mouseY * (scaleChange / oldScale);
                
                requestAnimationFrame(() => {
                    updateImageTransform();
                });
            }
        }, { passive: false });


        // Toggle Selection Mode
        selectionModeBtn.addEventListener('click', () => {
            isSelectionMode = !isSelectionMode;
            selectionModeBtn.classList.toggle('active');
            selectionOverlay.style.display = isSelectionMode ? 'block' : 'none';
                    
            // Reset der Selection Box
            selectionBox.style.width = '0';
            selectionBox.style.height = '0';
            selectionBox.style.left = '0';
            selectionBox.style.top = '0';
            selectionBox.classList.remove('invalid-size');
            isDrawing = false;  // Stelle sicher, dass der Zeichenmodus zurückgesetzt ist

            // Disable all pan/zoom events when in selection mode
            if (isSelectionMode) {

                // Zoom-Buttons - deaktiviere EventListener
                zoomButtons.forEach(button => {
                    // Speichere den alten Click-Handler
                    button._oldClickHandler = button.onclick;
                    button.onclick = null;
                    // Visuelles Feedback
                    button.style.opacity = '0.5';
                    button.style.cursor = 'not-allowed';
                });

                wrapper.removeEventListener('mousedown', handleDragStart);
                wrapper.removeEventListener('mousemove', handleDragMove);
                wrapper.removeEventListener('mouseup', handleDragEnd);
                wrapper.removeEventListener('mouseleave', handleDragEnd);
                wrapper.removeEventListener('touchstart', handleTouchStart);
                wrapper.removeEventListener('touchmove', handleTouchMove);
                wrapper.removeEventListener('touchend', handleDragEnd);

            } else {
                // Re-enable all events when leaving selection mode

                // Stelle die Event-Listener der Zoom-Buttons wieder her
                zoomButtons.forEach(button => {
                    button.onclick = button._oldClickHandler;
                    button.style.opacity = '1';
                    button.style.cursor = 'pointer';
                });

                wrapper.addEventListener('mousedown', handleDragStart);
                wrapper.addEventListener('mousemove', handleDragMove);
                wrapper.addEventListener('mouseup', handleDragEnd);
                wrapper.addEventListener('mouseleave', handleDragEnd);
                wrapper.addEventListener('touchstart', handleTouchStart);
                wrapper.addEventListener('touchmove', handleTouchMove);
                wrapper.addEventListener('touchend', handleDragEnd);

            }

        });

        // Selection Box Drawing
        selectionOverlay.addEventListener('mousedown', (e) => {
            if (!isSelectionMode) return;
            isDrawing = true;
            const rect = selectionOverlay.getBoundingClientRect();
            startX = e.clientX - rect.left;
            startY = e.clientY - rect.top;
            
            selectionBox.style.left = `${startX}px`;
            selectionBox.style.top = `${startY}px`;
            selectionBox.style.width = '0';
            selectionBox.style.height = '0';

            //console.log("Start bei x" + startX + "\n und bei y" + startY)
        });

        selectionOverlay.addEventListener('mousemove', (e) => {
            if (!isDrawing) return;
            
            const rect = selectionOverlay.getBoundingClientRect();
            const currentX = e.clientX - rect.left;
            const currentY = e.clientY - rect.top;
            const width = currentX - startX;
            const height = currentY - startY;
            
            const validation = validateSelectionSize(width, height, scale);
    
            if (!validation.isValid) {
                selectionBox.classList.add('invalid-size');
            } else {
                selectionBox.classList.remove('invalid-size');
            }

            selectionBox.style.width = `${Math.abs(width)}px`;
            selectionBox.style.height = `${Math.abs(height)}px`;
            selectionBox.style.left = `${width < 0 ? currentX : startX}px`;
            selectionBox.style.top = `${height < 0 ? currentY : startY}px`;


            // console.log('Selection Debug:', {
            //     scale,
            //     width,
            //     height,
            //     currentSelectionArea: Math.abs(width * height),
            //     selectionAreaNormalized: selectionArea,
            //     maxArea,
            //     originalArea,
            //     relativeSize: (selectionArea / originalArea) * 100 + '%',
            //     dimensions: {
            //         originalWidth: ORIGINAL_WIDTH,
            //         originalHeight: ORIGINAL_HEIGHT,
            //         currentWidth: width,
            //         currentHeight: height,
            //         normalizedWidth: width / scale,
            //         normalizedHeight: height / scale
            //     }
            // });

        });

        selectionOverlay.addEventListener('mouseup', () => {
            if (!isDrawing) return;
            isDrawing = false;

            // Hier später: Prüfe, ob Sternbild in Auswahl liegt
            this.handleSelectionComplete()
        });

        // Touch-Events für Selection Box
        selectionOverlay.addEventListener('touchstart', (e) => {
            if (!isSelectionMode) return;
            isDrawing = true;
            const touch = e.touches[0];
            const rect = selectionOverlay.getBoundingClientRect();
            startX = touch.clientX - rect.left;
            startY = touch.clientY - rect.top;
            
            selectionBox.style.left = `${startX}px`;
            selectionBox.style.top = `${startY}px`;
            selectionBox.style.width = '0';
            selectionBox.style.height = '0';
        }, { passive: false });

        selectionOverlay.addEventListener('touchmove', (e) => {
            if (!isDrawing) return;
            e.preventDefault(); // Verhindert Scrollen
            
            const touch = e.touches[0];
            const rect = selectionOverlay.getBoundingClientRect();
            const currentX = touch.clientX - rect.left;
            const currentY = touch.clientY - rect.top;
            const width = currentX - startX;
            const height = currentY - startY;
            
            const validation = validateSelectionSize(width, height, scale);
    
            if (!validation.isValid) {
                selectionBox.classList.add('invalid-size');
            } else {
                selectionBox.classList.remove('invalid-size');
            }
            
            selectionBox.style.width = `${Math.abs(width)}px`;
            selectionBox.style.height = `${Math.abs(height)}px`;
            selectionBox.style.left = `${width < 0 ? currentX : startX}px`;
            selectionBox.style.top = `${height < 0 ? currentY : startY}px`;
        }, { passive: false });


        selectionOverlay.addEventListener('touchend', () => {
            isDrawing = false;
            this.handleSelectionComplete()
        });

        // Neue Hilfsfunktion für die Größenvalidierung
        function validateSelectionSize(width, height, scale) {
            const rect = document.getElementById('starmapImage').getBoundingClientRect();
            const currentImageArea = rect.width * rect.height;
            const maxArea = currentImageArea * maxArea_rel;
            const selectionArea = Math.abs(width * height);
        
            // console.log('Touch Selection Debug:', {
            //     scale,
            //     width,
            //     height,
            //     currentSelectionArea: selectionArea,
            //     imageSize: {
            //         width: rect.width,
            //         height: rect.height,
            //         area: currentImageArea
            //     },
            //     maxArea,
            //     percentage: (selectionArea / currentImageArea) * 100 + '%'
            // });
        
            return {
                isValid: selectionArea <= maxArea,
                selectionArea,
                maxArea
            };
        }
    }

    // Event-Handler für die Validierung
    handleSelectionComplete() {
        const selectionBox = document.getElementById('selectionBox');
        
        // Prüfe erst, ob die Box eine gültige Größe hat
        if (selectionBox.classList.contains('invalid-size')) {
            this.showSelectionFeedback(false, 'Na Du Fritte?\n Machst Du es Dir besonders einfach? 😏\n (Die Auswahl ist zu groß!)');
            return;
        }
    
        const result = this.validateSelection(selectionBox);
        
        if (result.valid) {
            this.showSelectionFeedback(true, result.reason);
            // Zeige das Sternbild an und gehe zu Level 3
            this.setConstellationVisible(this.constellation.id);
            setTimeout(() => {
                this.currentLevel = 3;
                this.showLevel();
                this.saveGameState();

                // Deaktiviere Selektionsmodus
                const selectionOverlay = document.getElementById('selectionOverlay');
                const selectionModeBtn = document.getElementById('selectionModeBtn');
                const selectionFeedback = document.querySelector('.selection-feedback');
                if (selectionOverlay) {
                    selectionOverlay.style.display = 'none';
                }
                if (selectionModeBtn) {
                    selectionModeBtn.classList.remove('active');
                }
                if (selectionFeedback) {
                    selectionFeedback.style.display = 'none';
                }
            }, 2500);
        } else {
            this.showSelectionFeedback(false, result.reason);
        }
    }

    validateSelection(selectionBox) {
        // 1. Setup
        const wrapper = document.getElementById('starmapWrapper');
        const layers = document.getElementById('starmapLayers');
        const transform = new DOMMatrix(window.getComputedStyle(layers).transform);
        const scale = transform.a;
        const image = document.getElementById('starmapImage');
        const coords = this.constellation.coordinates;

        const ORIGINAL_WIDTH = 1340.0;
        const ORIGINAL_HEIGHT = 1369.0;
        const imageWidth = parseFloat(image.width);
        const imageHeight = parseFloat(image.height);

        // Centroid skalieren
        // Relative Position von centroid im Bild
        let centroid_rel_x = parseFloat(coords.centroid.x) / parseFloat(ORIGINAL_WIDTH);
        let centroid_rel_y = parseFloat(coords.centroid.y) / parseFloat(ORIGINAL_HEIGHT);
        
        // Wende relative Position auf das transformierte Bild an
        centroid_rel_x = centroid_rel_x * parseFloat(image.width);
        centroid_rel_y = centroid_rel_y * parseFloat(image.height);

        // Boundaries skalieren
        let bounds_minX_rel = (coords.bounds.minX / ORIGINAL_WIDTH) * imageWidth;
        let bounds_maxX_rel = (coords.bounds.maxX / ORIGINAL_WIDTH) * imageWidth;
        let bounds_minY_rel = (coords.bounds.minY / ORIGINAL_HEIGHT) * imageHeight;
        let bounds_maxY_rel = (coords.bounds.maxY / ORIGINAL_HEIGHT) * imageHeight;
        let bounds_width_rel = (coords.bounds.width / ORIGINAL_WIDTH) * imageWidth;
        let bounds_height_rel = (coords.bounds.height / ORIGINAL_HEIGHT) * imageHeight;
        
        
        // 2. Transformiere Selection Box in Image-Koordinaten zurück
        // Get all relevant rectangles
        const wrapperRect = wrapper.getBoundingClientRect();
        const layersRect = layers.getBoundingClientRect();
        const boxRect = selectionBox.getBoundingClientRect();

        const selectionInImage = {
            left: ((boxRect.left - wrapperRect.left) - transform.e) / scale,
            right: ((boxRect.right - wrapperRect.left) - transform.e) / scale,
            top: ((boxRect.top - wrapperRect.top) - transform.f) / scale,
            bottom: ((boxRect.bottom - wrapperRect.top) - transform.f) / scale
        };
    
        // 3. Debug-Visualisierung
        // Entferne altes Debug-Overlay falls vorhanden
        // const oldDebug = layers.querySelector('.debug-overlay');
        // if (oldDebug) oldDebug.remove();
    
        // const debugOverlay = document.createElement('div');
        // //debugOverlay.className = 'constellation-overlays'; // Nutze dieselbe Klasse wie die SVGs
        // debugOverlay.style.cssText = `
        //     position: absolute;
        //     top: 0;
        //     left: 0;
        //     right: 0;
        //     bottom: 0;
        //     width: 100%;
        //     height: 100%;
        //     pointer-events: none;
        //     z-index: 999;
        //     display: flex;
        //     justify-content: center;
        //     align-items: center;
        //     aspect-ratio: 1340 / 1369;
        // `;

        // // Centroid mit denselben Positionierungseigenschaften wie die SVGs
        // const centroidPoint = document.createElement('div');
        // centroidPoint.style.cssText = `
        //     position: absolute;
        //     left: ${centroid_rel_x}px;
        //     top: ${centroid_rel_y}px;
        //     right: 0;
        //     bottom: 0;
        //     width: 6px;
        //     height: 6px;
        //     background: yellow;
        //     border-radius: 50%;
        //     object-fit: contain;
        //     transform-origin: 0 0;
        //     display: flex;
        //     justify-content: center;
        //     align-items: center;
        // `;

        // // Bounds Box mit denselben Positionierungseigenschaften
        // const boundsBox = document.createElement('div');
        // boundsBox.style.cssText = `
        //     position: absolute;
        //     left: ${bounds_minX_rel}px;
        //     top: ${bounds_minY_rel}px;
        //     width: ${bounds_width_rel}px;
        //     height: ${bounds_height_rel}px;
        //     border: 2px dashed yellow;
        //     background: rgba(255, 255, 0, 0.1);
        //     transform-origin: 0 0;
        // `;

        // debugOverlay.appendChild(centroidPoint);
        // debugOverlay.appendChild(boundsBox);
        // layers.appendChild(debugOverlay);
        // setTimeout(() => debugOverlay.remove(), 2000);
    
        // console.log('Debug Info:', {
        //     scale,
        //     transform: {
        //         e: transform.e,
        //         f: transform.f
        //     },
        //     wrapperRect,
        //     layersRect,
        //     boxRect,
        //     selectionInImage,
        //     centroid: {
        //         x: centroid_rel_x,
        //         y: centroid_rel_y
        //     }
        // });

        // 4. Prüfe ob Centroid in der Auswahl liegt
        const centroidInBox = 
            centroid_rel_x >= selectionInImage.left &&
            centroid_rel_x <= selectionInImage.right &&
            centroid_rel_y >= selectionInImage.top &&
            centroid_rel_y <= selectionInImage.bottom;
    
        if (!centroidInBox) {
            return { valid: false, reason: 'Echt jetzt!? Versuchs nochmal! 🤡 (Zentrum des Sternbilds außerhalb der Auswahl)' };
        }
    
        // 5. Berechne Überlappung
        const overlapBounds = {
            left: Math.max(selectionInImage.left, bounds_minX_rel),
            right: Math.min(selectionInImage.right, bounds_maxX_rel),
            top: Math.max(selectionInImage.top, bounds_minY_rel),
            bottom: Math.min(selectionInImage.bottom, bounds_maxY_rel)
        };
    
        const overlapWidth = Math.max(0, overlapBounds.right - overlapBounds.left);
        const overlapHeight = Math.max(0, overlapBounds.bottom - overlapBounds.top);
        const overlapArea = overlapWidth * overlapHeight;
    
        const constellationArea = bounds_width_rel * bounds_height_rel;
        const coveragePercent = (overlapArea / constellationArea) * 100;
    
        return {
            valid: coveragePercent >= 80,
            coverage: coveragePercent,
            reason: coveragePercent >= 80 
                ? 'GROß (zur Abwechslung 🌞)\nSternbild gefunden!' 
                : `Wie viel Dioptrien sitzen vor dem Bildschirm? 💩 Nur ${Math.round(coveragePercent)}% des Sternbilds sind in der Auswahl.`
        };
    }


    // Visuelles Feedback
    showSelectionFeedback(isCorrect, message) {
        const selectionBox = document.getElementById('selectionBox');
        selectionBox.classList.add(isCorrect ? 'correct' : 'incorrect');
        
        // Feedback-Element erstellen
        const feedback = document.createElement('div');
        feedback.className = `selection-feedback ${isCorrect ? 'correct' : 'incorrect'}`;
        feedback.textContent = message;
        document.getElementById('starmapWrapper').appendChild(feedback);

        // Nach kurzer Zeit wieder entfernen
        setTimeout(() => {
            selectionBox.classList.remove('correct', 'incorrect');
            feedback.remove();
        }, 2500);
    }
    
    // Einzeichnen der Sternenbilder für abgeschlossene Challenges
    createConstellationOverlays() {
        // console.log('Erstelle Overlays für folgende Constellations:', 
            // this.constellations
                // .filter(constellation => this.isConstellationVisible(constellation.id))
                // .map(c => c.id)
        // );

        // Preload-Funktion
        const preloadSVG = (url) => {
            return new Promise((resolve, reject) => {
                const img = new Image();
                img.onload = () => {
                    console.log(`SVG geladen: ${url}`);
                    resolve(url);
                };
                img.onerror = () => {
                    console.error(`Fehler beim Laden von SVG: ${url}`);
                    reject(url);
                };
                img.src = url;
            });
        };

        // Erst alle SVGs laden
        const visibleConstellations = this.constellations
        .filter(constellation => this.isConstellationVisible(constellation.id));

        // const debugPoint = `
        // <div class="debug-centroid" style="
        //     position: absolute;
        //     left: ${this.constellation.coordinates.centroid.x}px;
        //     top: ${this.constellation.coordinates.centroid.y}px;
        //     width: 6px;
        //     height: 6px;
        //     background: red;
        //     border-radius: 50%;
        //     z-index: 999;
        //     pointer-events: none;
        // "></div>
        // `;
        //console.log(debugPoint)

        //console.log(this.constellation.id)
        Promise.all(visibleConstellations.map(constellation => 
            preloadSVG(`./assets/constellations/${constellation.id}.svg`)
        ))
        .then(() => {
            // Wenn alle SVGs geladen sind, HTML generieren
            const overlaysHTML = visibleConstellations
                .map(constellation => {
                    const svgUrl = `./assets/constellations/${constellation.id}.svg`;
                    const isCompleted = this.isConstellationCompleted(constellation.id);
    
                    return `
                        <img 
                            src="${svgUrl}"
                            class="constellation-overlay ${isCompleted ? 'visible' : ''}"
                            data-constellation-id="${constellation.id}"
                            alt="Overlay für ${constellation.name}"
                            loading="eager" 
                            decoding="sync"
                            vector-effect="non-scaling-stroke"
                        >
                    `;
                })
                .join('');
    
            // Overlay Container suchen/erstellen und HTML einfügen
            const overlaysContainer = document.getElementById('constellationOverlays');
            if (overlaysContainer) {
                //console.log('Füge Overlays ein:', overlaysHTML);
                overlaysContainer.innerHTML = overlaysHTML;
            } else {
                console.error('Overlay container nicht gefunden!');
            }
        })
        .catch(errors => {
            console.error('Fehler beim Laden der SVGs:', errors);
        });
    
        // Leeren String zurückgeben während des Ladens
        return '';
    }

    // Hilfsmethoden für den Zustand
    isConstellationVisible(constellationId) {
        return this.constellationStates[constellationId]?.visible || false;
    }

    setConstellationVisible(constellationId, visible = true) {
        if (this.constellationStates[constellationId]) {
            this.constellationStates[constellationId].visible = visible;
        }
    }

    // Prüfen, ob ein Sternbild "completed" ist
    isConstellationCompleted(constellationId) {
        // Ein Sternbild ist completed wenn:
        // 1. Es ein früheres Sternbild ist (Index kleiner als aktueller Index)
        // ODER
        // 2. Es das aktuelle Sternbild ist UND mindestens Level 3 erreicht wurde
        const isCompletedByIndex = this.currentConstellationIndex > this.constellations.findIndex(c => c.id === constellationId);
        const isCurrentConstellation = this.constellation.id === constellationId && this.currentLevel >= 3;
        
        // Gebe true zurück, wenn eine der Bedingungen erfüllt ist
        return isCompletedByIndex || isCurrentConstellation;
    }

    updateConstellationOverlays() {
        // Finde den Container für die Overlays
        const overlaysContainer = document.getElementById('constellationOverlays');
        if (!overlaysContainer) {
            console.error('Overlay container not found');
            return;
        }
    
        overlaysContainer.innerHTML = this.createConstellationOverlays();
    }

    logConstellationStates() {
        console.log('Current States:', {
            currentIndex: this.currentConstellationIndex,
            currentLevel: this.currentLevel,
            states: this.constellationStates
        });
    }

//--- ENDE Challenge 

    //Hinweise
    createLevel2() {
        this.nextButton.style.display = 'none';
        return `
            <div class="card">
                <div class="constellation-title-wrapper">
                    <div class="constellation-subtitle">Hilfreiche Hinweise</div>
                </div>
            ${this.createHints()}
            </div>
        `;
    }

    createHints() {
        //1. Iteriere durch alle Hinweise per map (lambda(?) function) und index
        //2. Erstelle je Hint ein Div Container, der entweder offen oder (teil) geschlossen ist
        //   Return entweder offenen Hinweis ODER geschlossen und dann entweder teil oder ganz geschlossen
        //3. Verknüpfung per .join
        return `
            <div class="hints-container">
                ${this.constellation.puzzle.hints.map((hint, index) => {
                    const state = this.hintStates[index];
                    
                    if (state === 'revealed') {
                        return `
                            <div class="hint hint-revealed">
                                <div class="hint-text">${hint}</div>
                            </div>`;
                    }
                    
                    const icon = state === 'locked' ? '🔒' : '🔓';
                    const stateClass = `hint-${state}`;
                    
                    return `
                        <div class="hint ${stateClass}" data-hint-index="${index}">
                            <span class="hint-icon">${icon}</span>
                            <span class="hint-status">Hinweis ${index + 1}</span>
                        </div>`;
                }).join('')}
            </div>
        `;
    }

    cycleHintState(hintIndex) {
        const currentState = this.hintStates[hintIndex];
        
        switch (currentState) {
            case 'locked':
                this.hintStates[hintIndex] = 'revealed';
                break;
        }
        
        this.updateHints();
    }

    updateHints() {
        const hintsContainer = this.contentDiv.querySelector('.hints-container');
        if (hintsContainer) {
            hintsContainer.innerHTML = this.createHints();
            this.attachHintListeners();
        }
    }

    attachHintListeners() {
        const hints = this.contentDiv.querySelectorAll('.hint[data-hint-index]');
        hints.forEach(hint => {
            hint.addEventListener('click', (e) => {
                const index = parseInt(hint.dataset.hintIndex);
                this.cycleHintState(index);
            });
        });
    }

    //WENN Gelöst:
    //Informationen zu Mythologie und Astronomie
    createLevel3() {
        // Aktuelles Sternenbild wird sichtbar
        this.setConstellationVisible(this.constellation.id);
        
        // Auch alle vorherigen Sternenbilder werden sichtbar
        this.constellations.forEach((constellation, index) => {
            if (index < this.currentConstellationIndex) {
                this.setConstellationVisible(constellation.id);
            }
        });

        this.nextButton.style.display = 'block';
        this.nextButton.innerHTML = "Du willst mehr wissen? 📖"
        const { mythology, astronomy } = this.constellation.basics;

        // Aktualisiere nach einer kurzen Verzögerung die Overlays
        // setTimeout(() => {
        //     this.updateConstellationOverlays();
        // }, 100);

        return `
            <div class="card l3">
                <h2 class="subtitle">${mythology.icon} ${mythology.title}</h2>
                <p>${mythology.text}</p>
                <h2 class="subtitle">${astronomy.icon} ${astronomy.title}</h2>
                <ul class="facts-list">
                    ${astronomy.facts.map(fact => `<li>${fact}</li>`).join('')}
                </ul>
            </div>
        `;
    }

    //Spannende Details und Sidefacts
    createLevel4() {
        this.nextButton.innerHTML = "Nächstes LEVEL"
        const { details1, details2 } = this.constellation.details;
        return `
            <div class="card">
                <h2 class="subtitle">${details1.icon} ${details1.title}</h2>
                <ul class="facts-list">
                    ${details1.facts.map(fact => `<li>${fact}</li>`).join('')}
                </ul>
                <h2 class="subtitle">${details2.icon} ${details2.title}</h2>
                <h3>${details2.subtitle}</h3>
                <ul class="facts-list">
                    ${details2.facts.map(fact => `<li>${fact}</li>`).join('')}
                </ul>
            </div>
        `;
    }

    // Nächstes Sternbild
    moveToNextConstellation() {
        this.currentConstellationIndex++;
    
        if (this.currentConstellationIndex < this.constellations.length) {
            // Setze alle bisherigen Konstellationen auf sichtbar
            this.constellations.forEach((constellation, index) => {
                if (index < this.currentConstellationIndex) {
                    this.setConstellationVisible(constellation.id);
                }
            });
    
            this.constellation = this.constellations[this.currentConstellationIndex];
            this.currentLevel = 1;
            this.initializeHintStates();
            this.nextButton.style.display = 'block'; 
            this.contentDiv.innerHTML = ''; 
            this.showLevel();               
        } else {
            this.showCompletionScreen();
        }
    }

    // ENDE → Abschluss-Screen
    showCompletionScreen() {
        // Content erstellen
        const completionContent = `
            <div class="card completion-screen">
                <div class="constellation-title-wrapper">
                    <h2 class="constellation-title">Gratulation!</h2>
                    <div class="constellation-subtitle">Alle Sternbilder entdeckt</div>
                </div>
                <div class="puzzle-text">
                    Du hast alle Sternbilder erfolgreich erkundet!
                </div>
            </div>
        `;
        
        // Content einfügen
        this.contentDiv.innerHTML = completionContent;
        this.nextButton.style.display = 'none';
    
        // Kurz warten bis DOM aktualisiert ist
        requestAnimationFrame(() => {
            // Dann erst die visible-Klasse hinzufügen
            const completionCard = this.contentDiv.querySelector('.completion-screen');
            if (completionCard) {
                completionCard.classList.add('visible');
            }
        });
    }

    // Methode um den Fortschritt anzuzeigen
    showProgress() {
        return `
            <div class="progress-indicator">
                Sternbild ${this.currentConstellationIndex + 1} von ${this.constellations.length}
            </div>
        `;
    }
}
