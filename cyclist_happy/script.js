const scroller = scrollama();

const choices       = document.querySelectorAll('.choice');
const scrollPrompt  = document.getElementById('scroll-prompt');
const storyHook     = document.getElementById('story-hook');
const scrollyCont   = document.getElementById('scrolly-container');
const plotFrame     = document.getElementById('plot-frame');
const floatingChar  = document.getElementById('floating-char');
const floatingImg   = document.getElementById('floating-char-img');
const hookTitle     = document.getElementById('hook-title');
const changeBtn     = document.getElementById('change-btn');

let currentMode = "";
let scrollamaReady = false;

// ── NYC map background — draws itself on load ────────────────────────────────
(function drawNYCMap() {
    const svg    = d3.select('#nyc-map-bg');
    const width  = window.innerWidth;
    const height = window.innerHeight;

    svg.attr('viewBox', `0 0 ${width} ${height}`);

    d3.json('nyc.geojson').then(data => {
        const projection = d3.geoMercator().fitSize([width, height], data);
        const path = d3.geoPath().projection(projection);

        const paths = svg.selectAll('path')
            .data(data.features)
            .enter()
            .append('path')
            .attr('d', path);

        // For each path, measure its length and set up the drawing animation.
        // stroke-dasharray = total length  → whole stroke is one invisible dash gap
        // stroke-dashoffset = total length → stroke starts fully hidden
        // Animating dashoffset → 0 reveals the stroke as if being drawn by a pen.
        paths.each(function (d, i) {
            const len = this.getTotalLength();
            d3.select(this)
                .attr('stroke-dasharray', len)
                .attr('stroke-dashoffset', len)
                .style('animation', `draw-path 2.5s ease forwards`)
                .style('animation-delay', `${i * 0.18}s`);
        });
    });
})();

// ── Character helper ─────────────────────────────────────────────────────────
function setCharacter(mode, emotion) {
    const prefix = mode === 'motorist' ? 'driver' : mode;
    floatingImg.src = `${prefix}_${emotion}.svg`;
}

function showCharacter() {
    floatingChar.classList.remove('hidden');
    // Small delay so CSS transition fires
    requestAnimationFrame(() => floatingChar.classList.add('visible'));
}

// ── Reset selection so user can switch persona ───────────────────────────────
function resetSelection() {
    choices.forEach(c => {
        c.classList.remove('fade-out', 'selected-shake');
    });
    scrollPrompt.classList.add('hidden');
    storyHook.classList.add('hidden');
    scrollyCont.classList.add('hidden');
    floatingChar.classList.remove('visible');
    setTimeout(() => floatingChar.classList.add('hidden'), 500);
    currentMode = '';
}

changeBtn.addEventListener('click', resetSelection);

// ── Persona selection ────────────────────────────────────────────────────────
choices.forEach(choice => {
    choice.addEventListener('click', () => {
        const mode = choice.getAttribute('data-perspective');

        // If same persona clicked again, ignore
        if (mode === currentMode) return;

        currentMode = mode;

        // Dim others, animate selected
        choices.forEach(c => {
            c.classList.remove('selected-shake');
            c.classList.add('fade-out');
        });
        choice.classList.remove('fade-out');
        choice.classList.add('selected-shake');

        // Show sections
        storyHook.classList.remove('hidden');
        scrollyCont.classList.remove('hidden');
        scrollPrompt.classList.remove('hidden');

        // Load content
        plotFrame.src = `${mode}_hourly_plot.html`;
        hookTitle.innerText = `The streets of NYC from a ${mode}'s perspective...`;

        // Show floating character
        setCharacter(mode, 'happy');
        showCharacter();

        // Init scrollama once
        if (!scrollamaReady) {
            initScrollama();
            scrollamaReady = true;
        }
    });
});

// ── Scrollama ────────────────────────────────────────────────────────────────
function initScrollama() {
    scroller
        .setup({ step: '.step', offset: 0.6, debug: false })
        .onStepEnter(response => {
            response.element.classList.add('is-active');
            // Swap character emotion per step
            const emotions = ['thinking', 'surprised', 'scared', 'happy'];
            const emotion  = emotions[response.index % emotions.length];
            if (currentMode) setCharacter(currentMode, emotion);
        });
}

window.addEventListener('resize', scroller.resize);
