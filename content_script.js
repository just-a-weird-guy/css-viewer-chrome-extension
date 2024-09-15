/* global browser, chrome */
(() => {
    let isActive = false;
    let cssViewerBox = null;
    let highlightedElement = null;
    let overlay = null;
    let colorPickerButton = null;

    function toggleCssViewer() {
        isActive = !isActive;
        if (isActive) {
            createCssViewerBox();
            createOverlay();
            createColorPicker();
            document.addEventListener('mousemove', highlightElement);
            document.addEventListener('click', handleClick, true);
        } else {
            removeCssViewerBox();
            removeOverlay();
            removeColorPicker();
            removeHighlight();
            document.removeEventListener('mousemove', highlightElement);
            document.removeEventListener('click', handleClick, true);
        }
    }

    function createCssViewerBox() {
        cssViewerBox = document.createElement('div');
        cssViewerBox.id = 'css-viewer';
        Object.assign(cssViewerBox.style, {
            position: 'fixed',
            top: '20px',
            left: '20px',
            backgroundColor: '#202324',
            border: '1px solid #444',
            borderRadius: '8px',
            padding: '0',
            zIndex: '10001',
            height: '500px',
            width: '437.5px',
            display: 'flex',
            flexDirection: 'column',
            fontFamily: 'Arial, sans-serif',
            color: '#e0e0e0',
            boxShadow: '0 0 10px rgba(0,0,0,0.5)',
            userSelect: 'none',
            fontSize: '13.75px',
            overflow: 'hidden'
        });

        const header = document.createElement('div');
        Object.assign(header.style, {
            position: 'sticky',
            top: '0',
            backgroundColor: '#2b2b2b',
            padding: '10px',
            zIndex: '2',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid #444',
        });

        const title = document.createElement('h4');
        title.textContent = 'CSS Viewer';
        title.style.margin = '0';
        title.style.flexGrow = '1';
        title.style.textAlign = 'center';
        title.style.fontSize = '20px';  // Increased by 125%

        const closeButton = createButton('Close', () => toggleCssViewer());
        Object.assign(closeButton.style, {
            padding: '6.25px 12.5px',  // Increased by 125%
            fontSize: '13.75px'  // Increased by 125%
        });

        header.appendChild(title);
        header.appendChild(closeButton);

        const content = document.createElement('div');
        Object.assign(content.style, {
            overflowY: 'auto',
            flex: '1',
            padding: '15px'
        });
        content.innerHTML = `
            <p style="color: #bbb;">Hover over an element and click to see its CSS properties.</p>
            <div id="properties-container"></div>`;

        cssViewerBox.appendChild(header);
        cssViewerBox.appendChild(content);
        document.body.appendChild(cssViewerBox);

        const copyAllButton = createButton('Copy All', copyAllCSS);
        Object.assign(copyAllButton.style, {
            position: 'sticky',
            bottom: '0',
            left: '0',
            right: '0',
            width: '100%',
            textAlign: 'center',
            padding: '10px',
            backgroundColor: '#0943a2',
            color: 'white',
            border: 'none',
            borderRadius: '0 0 8px 8px',
            cursor: 'pointer',
            fontSize: '13.75px',
            zIndex: '2'
        });
        copyAllButton.id = 'copy-all-button';
        cssViewerBox.appendChild(copyAllButton);
        
        // Store the current element's selector and CSS attributes
        window.currentElementSelector = '';
        window.cssAttributes = {};
        
        // Make the CSS viewer draggable
        let isDragging = false;
        let currentX;
        let currentY;
        let initialX;
        let initialY;
        let xOffset = 0;
        let yOffset = 0;
        
        document.addEventListener("mousedown", dragStart);
        document.addEventListener("mousemove", drag);
        document.addEventListener("mouseup", dragEnd);
        
        function dragStart(e) {
            if (e.target === header || header.contains(e.target)) {
                initialX = e.clientX - xOffset;
                initialY = e.clientY - yOffset;
                isDragging = true;
                e.preventDefault();
            }
        }
        
        function drag(e) {
            if (isDragging) {
                e.preventDefault();
                currentX = e.clientX - initialX;
                currentY = e.clientY - initialY;
                
                xOffset = currentX;
                yOffset = currentY;
                
                setTranslate(currentX, currentY, cssViewerBox);
            }
        }
        
        function dragEnd(e) {
            initialX = currentX;
            initialY = currentY;
            
            isDragging = false;
        }
        
        function setTranslate(xPos, yPos, el) {
            el.style.transform = `translate3d(${xPos}px, ${yPos}px, 0)`;
        }
    }

    function createButton(text, onClick) {
        const button = document.createElement('button');
        button.textContent = text;
        button.dataset.originalText = text; // Store original text
        Object.assign(button.style, {
            backgroundColor: text === 'Close' ? '#942320' : '#0943a2',
            border: 'none',
            color: 'white',
            padding: '7.5px 15px',
            textAlign: 'center',
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '14px',
            cursor: 'pointer',
            borderRadius: '4px',
            transition: 'all 0.3s ease',
            width: 'auto', // Ensure consistent width
            minWidth: '75px' // Set a minimum width
        });
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            onClick(button);
        });
        return button;
    }

    function removeCssViewerBox() {
        if (cssViewerBox) {
            cssViewerBox.remove();
            cssViewerBox = null;
        }
    }

    function createOverlay() {
        overlay = document.createElement('div');
        Object.assign(overlay.style, {
            position: 'fixed',
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0,0,0,0.1)',
            zIndex: '10000',
            pointerEvents: 'none'
        });
        document.body.appendChild(overlay);
    }

    function removeOverlay() {
        if (overlay) {
            overlay.remove();
            overlay = null;
        }
    }

    function highlightElement(event) {
        if (!isActive) return;
        
        removeHighlight();
        
        if (!event.target.closest('#css-viewer') && !event.target.closest('#color-picker-button')) {
            highlightedElement = event.target;
            highlightedElement.style.outline = '2px solid #ff4081';
            highlightedElement.style.outlineOffset = '-2px';
            updateColorPicker(highlightedElement);
        }
    }

    function removeHighlight() {
        if (highlightedElement) {
            highlightedElement.style.outline = '';
            highlightedElement.style.outlineOffset = '';
            highlightedElement = null;
        }
    }

    function handleClick(event) {
        if (!isActive) return;
        
        if (event.target.closest('#css-viewer') || event.target.closest('#color-picker-button')) return;
        
        event.preventDefault();
        event.stopPropagation();
        
        showCssProperties(event.target);
    }

    function createCopyButton(property, value) {
        const button = createButton('Copy', (button) => {
            copyToClipboard(`${property}: ${value}`, button);
        });
        button.dataset.originalText = 'Copy';
        return button;
    }

    function showCssProperties(element) {
        if (isActive && cssViewerBox) {
            const computedStyle = window.getComputedStyle(element);
            window.cssAttributes = {};
            window.currentElementSelector = getElementSelector(element);

            const elementType = element.tagName.toLowerCase();
            let relevantProperties = [];

            if (elementType === 'button') {
                relevantProperties = [
                    'padding', 'border', 'background-color', 'font-size', 'color', 'text-align'
                ];
            } else if (elementType === 'p' || elementType === 'span') {
                relevantProperties = [
                    'font-size', 'color', 'text-align', 'line-height', 'font-family'
                ];
            } else {
                relevantProperties = [
                    'width', 'height', 'padding', 'margin', 'border',
                    'color', 'background-color', 'font-size', 'font-family', 'font-weight',
                    'display', 'position', 'top', 'right', 'bottom', 'left',
                    'flex', 'grid', 'align-items', 'justify-content', 'text-align',
                    'opacity', 'z-index', 'overflow'
                ];
            }

            relevantProperties.forEach(prop => {
                const value = computedStyle.getPropertyValue(prop).trim();
                if (value && value !== 'none' && value !== 'normal' && value !== 'auto' && value !== '0px') {
                    window.cssAttributes[prop] = value;
                }
            });

            const propertiesContainer = document.getElementById('properties-container');
            propertiesContainer.innerHTML = ''; // Clear previous properties

            const sections = {
                'Layout': ['width', 'height', 'padding', 'margin', 'border'],
                'Typography': ['font-size', 'color', 'font-family', 'font-weight', 'line-height', 'text-align'],
                'Visual': ['background-color', 'opacity', 'z-index', 'box-shadow'],
                'Positioning': ['position', 'top', 'right', 'bottom', 'left'],
                'Flexbox': ['display', 'flex', 'align-items', 'justify-content'],
                'Grid': ['grid']
            };

            for (const [sectionName, sectionProperties] of Object.entries(sections)) {
                const sectionElement = document.createElement('div');
                sectionElement.innerHTML = `<h5 style="color: #ff4081; margin-bottom: 5px;">${sectionName}</h5>`;
                let hasProperties = false;
                sectionElement.style.marginBottom = '10px';

                for (const property of sectionProperties) {
                    if (window.cssAttributes[property]) {
                        hasProperties = true;
                        const propertyElement = document.createElement('div');
                        propertyElement.style.display = 'flex';
                        propertyElement.style.justifyContent = 'space-between';
                        propertyElement.style.marginBottom = '5px';
                        propertyElement.style.alignItems = 'center';
                        
                        const propertyText = document.createElement('span');
                        propertyText.textContent = `${property}: ${window.cssAttributes[property]}`;
                        propertyText.style.flexGrow = '1';
                        propertyText.style.marginRight = '10px';
                        propertyText.style.wordBreak = 'break-word';
                        propertyElement.appendChild(propertyText);
                        
                        const copyButton = createCopyButton(property, window.cssAttributes[property]);
                        copyButton.style.padding = '2px 5px';
                        copyButton.style.fontSize = '12px';
                        copyButton.style.flexShrink = '0';
                        copyButton.style.alignSelf = 'center';
                        propertyElement.appendChild(copyButton);
                        
                        sectionElement.appendChild(propertyElement);
                    }
                }

                if (hasProperties) {
                    propertiesContainer.appendChild(sectionElement);
                }
            }

            // Remove the creation of copyAllButton from here
            // The button is now created once in createCssViewerBox function
    
            updateColorPicker(element);
        }
    }
    
    function copyAllCSS() {
        if (window.currentElementSelector && window.cssAttributes) {
            const allProperties = Object.entries(window.cssAttributes)
                .map(([prop, value]) => `  ${prop}: ${value};`)
                .join('\n');
            const formattedCSS = `${window.currentElementSelector} {\n${allProperties}\n}`;
            const copyAllButton = document.getElementById('copy-all-button');
            copyToClipboard(formattedCSS, copyAllButton);
        } else {
            console.error('No element selected or CSS attributes available');
            alert('No CSS properties available to copy. Please select an element first.');
        }
    }
    
    // Removed redundant declarations as they are now window properties

    function copyToClipboard(text, button) {
        const originalText = button.dataset.originalText || button.textContent;
        const originalColor = button.style.backgroundColor;
        navigator.clipboard.writeText(text).then(() => {
            button.textContent = '✓';
            button.style.backgroundColor = '#28a745'; // Success green color
            button.style.transition = 'background-color 0.3s ease'; // Add transition
            button.disabled = true;
            setTimeout(() => {
                button.textContent = originalText;
                button.style.backgroundColor = originalColor;
                button.disabled = false;
            }, 2000);
        }).catch(err => {
            console.error('Failed to copy: ', err);
            alert('Failed to copy. Please try again.');
        });
    }

    function createColorPicker() {
        colorPickerButton = document.createElement('button');
        colorPickerButton.id = 'color-picker-button';
        colorPickerButton.innerHTML = `
            <svg fill="#5cb85c" height="30px" width="30px" version="1.1" id="Capa_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 60 60" xml:space="preserve" data-darkreader-inline-fill="" style="--darkreader-inline-fill: #000000;" stroke="#ffffff">
                <defs>
                    <!-- Removed rainbow gradient -->
                </defs>
                <g>
                    <path d="M8.212,49.758c-0.391-0.391-1.023-0.391-1.414,0l-2.5,2.5c-0.856,0.855-1.328,1.995-1.328,3.207 c0,1.211,0.472,2.351,1.328,3.207S6.293,60,7.505,60c1.211,0,2.351-0.472,3.207-1.328c1.768-1.77,1.768-4.646,0-6.414L8.212,49.758 z"></path>
                    <path d="M55.164,10.403c2.243-2.245,2.498-5.845,0.578-8.196C54.598,0.805,52.901,0,51.087,0c-1.606,0-3.112,0.622-4.242,1.751 l-3.526,3.527c-1.119,1.119-3.069,1.119-4.187,0l-0.583-0.583c-0.839-0.837-2.299-0.837-3.134,0.001L31.48,8.632 c-0.419,0.419-0.649,0.976-0.649,1.567c0,0.593,0.23,1.149,0.649,1.568l1.968,1.968L18.183,29l-0.999,0.999 c-1.562,1.562-2.727,3.501-3.395,5.688c-0.258,0.845-0.623,1.655-1.066,2.418c-0.028,0.048-0.048,0.099-0.076,0.146 c-0.022,0.036-0.05,0.069-0.072,0.105c-0.224,0.363-0.462,0.718-0.724,1.055c-0.289,0.37-0.6,0.723-0.932,1.055l-4.413,4.413 l5.656,5.656l4.375-4.374c1.354-1.353,3.037-2.355,4.87-2.898c1.289-0.383,2.501-0.979,3.618-1.721 c0.748-0.496,1.46-1.046,2.097-1.683L37.982,29h0l5.366-5.365l1.967,1.967c0.419,0.42,0.976,0.65,1.568,0.65 c0.592,0,1.148-0.23,1.567-0.649l3.936-3.936c0.864-0.864,0.864-2.271,0-3.136l-0.581-0.581c-0.56-0.56-0.867-1.303-0.867-2.094 s0.308-1.534,0.867-2.093L55.164,10.403z M35.153,29H21.011l13.851-13.851l7.071,7.071L35.153,29z"></path>
                </g>
            </svg>
        `;
        colorPickerButton.title = 'Pick Color';
        Object.assign(colorPickerButton.style, {
            backgroundColor: 'transparent',
            border: 'none',
            padding: '7.5px', // Adjusted for 125% increase
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            borderRadius: '6px', // Adjusted for 125% increase
            marginLeft: '15px', // Adjusted for 125% increase
            transition: 'all 0.3s ease'
        });

        colorPickerButton.addEventListener('mouseover', () => {
            colorPickerButton.style.backgroundColor = '#1a1c1d';
        });

        colorPickerButton.addEventListener('mouseout', () => {
            colorPickerButton.style.backgroundColor = 'transparent';
        });

        colorPickerButton.addEventListener('click', () => {
            if (!window.EyeDropper) {
                alert("Your browser does not support the EyeDropper API");
                return;
            }
            const eyeDropper = new window.EyeDropper();
            eyeDropper.open().then((result) => {
                const hexColor = result.sRGBHex;
                const colorDisplay = document.createElement('div');
                colorDisplay.textContent = `Selected color: ${hexColor}`;
                colorDisplay.style.backgroundColor = hexColor;
                colorDisplay.style.color = getContrastColor(hexColor);
                colorDisplay.style.padding = '10px';
                colorDisplay.style.marginTop = '10px';
                colorDisplay.style.borderRadius = '5px';
                
                const propertiesContainer = document.getElementById('properties-container');
                propertiesContainer.insertBefore(colorDisplay, propertiesContainer.firstChild);
                
                if (highlightedElement) {
                    highlightedElement.style.color = hexColor;
                    showCssProperties(highlightedElement);
                }
            }).catch((e) => {
                alert(`Error: ${e}`);
            });
        });
        
        function getContrastColor(hexColor) {
            const r = parseInt(hexColor.slice(1, 3), 16);
            const g = parseInt(hexColor.slice(3, 5), 16);
            const b = parseInt(hexColor.slice(5, 7), 16);
            const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
            return (yiq >= 128) ? 'black' : 'white';
        }

        // Add color picker button to the header
        const header = cssViewerBox.querySelector('div');
        header.insertBefore(colorPickerButton, header.firstChild);
        
        // Center the title
        const title = header.querySelector('h4');
        title.style.flexGrow = '1';
        title.style.textAlign = 'center';
        
        // Move close button to the right
        const closeButton = header.querySelector('button:last-child');
        header.appendChild(closeButton);
    }

    function removeColorPicker() {
        if (colorPickerButton) {
            colorPickerButton.remove();
            colorPickerButton = null;
        }
    }

    function updateColorPicker(element) {
        if (element) {
            const computedStyle = window.getComputedStyle(element);
            const color = rgbToHex(computedStyle.color);
            // Update color picker display or functionality here if needed
        }
    }

    function handleColorChange(event) {
        const newColor = event.target.value;
        const property = 'color'; // Assuming the property to change is 'color'

        if (highlightedElement) {
            highlightedElement.style[property] = newColor;
            showCssProperties(highlightedElement);
        }
    }

    function rgbToHex(rgb) {
        if (!rgb || rgb === 'rgba(0, 0, 0, 0)') return '#000000';
        
        const rgbValues = rgb.match(/\d+/g);
        if (!rgbValues || rgbValues.length < 3) return '#000000';
        
        return '#' + rgbValues.slice(0, 3).map(x => {
            const hex = parseInt(x).toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        }).join('');
    }

    if (typeof browser !== 'undefined' && browser.runtime && browser.runtime.onMessage) {
        browser.runtime.onMessage.addListener(
            function(request, sender, sendResponse) {
                console.log("Message received in content script:", request);
                if (request.action === "toggleCssViewer") {
                    toggleCssViewer();
                    sendResponse({status: "CSS Viewer toggled"});
                }
                return true;  // Indicates that the response is sent asynchronously
            }
        );
    } else if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
        chrome.runtime.onMessage.addListener(
            function(request, sender, sendResponse) {
                console.log("Message received in content script:", request);
                if (request.action === "toggleCssViewer") {
                    toggleCssViewer();
                    sendResponse({status: "CSS Viewer toggled"});
                }
                return true;  // Indicates that the response is sent asynchronously
            }
        );
    }

    console.log('CSS Viewer content script loaded');
    
    function getElementSelector(element) {
        if (element.id) {
            return '#' + element.id;
        }
        if (element.className) {
            return '.' + element.className.split(' ').join('.');
        }
        let selector = element.tagName.toLowerCase();
        let parent = element.parentNode;
        while (parent && parent !== document.body) {
            if (parent.id) {
                return '#' + parent.id + ' > ' + selector;
            }
            let siblings = parent.children;
            let index = Array.prototype.indexOf.call(siblings, element) + 1;
            selector = `${parent.tagName.toLowerCase()} > ${selector}:nth-child(${index})`;
            element = parent;
            parent = parent.parentNode;
        }
        return selector;
    }
})();
