const scroller = scrollama();

const choices       = document.querySelectorAll('.choice');
const scrollPrompt  = document.getElementById('scroll-prompt');
const storyHook     = document.getElementById('story-hook');
const scrollyCont   = document.getElementById('scrolly-container');
const plotFrame     = document.getElementById('plot-frame');
const plotCaption   = document.getElementById('plot-caption');
const floatingChar  = document.getElementById('floating-char');
const floatingImg   = document.getElementById('floating-char-img');
const thoughtBubble = document.getElementById('thought-bubble');
const thoughtText   = document.getElementById('thought-text');
const hookTitle     = document.getElementById('hook-title');
const changeBtn     = document.getElementById('change-btn');

let currentMode    = "";
let scrollamaReady = false;
let suppressThought = false; // true while we want to block the bubble

// ── Story content per persona and step ──────────────────────────────────────
// Each step defines which plot to show, a figure caption, character emotion,
// and the thought bubble text shown next to the character.
const STORY = {
    cyclist: [
        {
            plot:    'cyclist_hourly_plot.html',
            caption: 'Figure 1: Cyclist crashes by hour of day. The evening rush (16–18h) sees the highest volume, but late-night crashes carry a disproportionately high fatality rate.',
            emotion: 'thinking',
            thought: 'Rush hour... that\'s when cars stop looking out for me.',
        },
    ],
    pedestrian: [
        {
            plot:    'pedestrian_hourly_plot.html',
            caption: 'Figure 1: Pedestrian crashes by hour of day. Most crashes happen during the evening commute, but midnight hours are when a single crash is most likely to be fatal.',
            emotion: 'thinking',
            thought: 'I thought daytime was safe... the data says otherwise.',
        },
    ],
    motorist: [
        {
            plot:    'motorist_hourly_plot.html',
            caption: 'Figure 1: Motorist crashes by hour of day. Rush hour dominates crash volume — but the deadliest crashes happen long after traffic has cleared.',
            emotion: 'thinking',
            thought: 'Rush hour is stressful, but is it actually the most dangerous?',
        },
        {
            plot:    'risk_vs_reality_motorist_plot.html',
            caption: 'Figure 2: Risk vs. reality for motorists. Crash volume and fatality rate tell very different stories — the hours you worry about may not be the ones that should worry you.',
            emotion: 'surprised',
            thought: 'Wait — late at night is when I\'m really at risk?',
        },
        {
            plot:    'weather_effect_motorist_plot.html',
            caption: 'Figure 3: Weather and motorist crashes. Winter storm days see far more crashes on average than clear days — slippery roads and reduced visibility change the game.',
            emotion: 'scared',
            thought: 'Snow days feel dangerous... and the data backs me up.',
        },
        {
            plot:    'bubble_map_motorist.html',
            caption: 'Figure 4: Motorist danger zones across NYC. Each bubble marks a crash cluster — size shows total crashes, colour shows fatality rate. The deadliest spots are not always the busiest.',
            emotion: 'surprised',
            thought: 'I drive these streets every day... I had no idea.',
        },
    ],
};

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

        paths.each(function (d, i) {
            const len = this.getTotalLength();
            d3.select(this)
                .attr('stroke-dasharray', len)
                .attr('stroke-dashoffset', len)
                .style('animation', 'draw-path 2.5s ease forwards')
                .style('animation-delay', `${i * 0.18}s`);
        });
    });
})();

// ── Character helpers ────────────────────────────────────────────────────────
function setCharacter(mode, emotion) {
    const prefix = mode === 'motorist' ? 'driver' : mode;
    floatingImg.src = `${prefix}_${emotion}.svg`;
}

function setThought(text) {
    if (suppressThought) return;
    if (text) {
        thoughtText.textContent = text;
        thoughtBubble.classList.remove('hidden');
        // Two rAF frames ensure display:none is cleared before opacity transitions
        requestAnimationFrame(() => requestAnimationFrame(() => thoughtBubble.classList.add('visible')));
    } else {
        thoughtBubble.classList.remove('visible');
        setTimeout(() => thoughtBubble.classList.add('hidden'), 300);
    }
}

function showCharacter() {
    floatingChar.classList.remove('hidden');
    requestAnimationFrame(() => floatingChar.classList.add('visible'));
}

// ── Load a story step ────────────────────────────────────────────────────────
function loadStep(mode, stepIndex, showThought = true) {
    const steps = STORY[mode];
    if (!steps) return;
    const step = steps[stepIndex] || steps[steps.length - 1];

    plotFrame.src    = step.plot;
    plotCaption.textContent = step.caption;
    setCharacter(mode, step.emotion);
    if (showThought) setThought(step.thought);
}

// ── Reset so user can pick a different persona ───────────────────────────────
function resetSelection() {
    choices.forEach(c => c.classList.remove('fade-out', 'selected-shake'));
    scrollPrompt.classList.add('hidden');
    storyHook.classList.add('hidden');
    scrollyCont.classList.add('hidden');
    floatingChar.classList.remove('visible');
    thoughtBubble.classList.remove('visible');
    setTimeout(() => {
        floatingChar.classList.add('hidden');
        thoughtBubble.classList.add('hidden');
    }, 500);
    currentMode = '';
    suppressThought = false;
}

changeBtn.addEventListener('click', resetSelection);

// ── Persona selection ────────────────────────────────────────────────────────
choices.forEach(choice => {
    choice.addEventListener('click', () => {
        const mode = choice.getAttribute('data-perspective');
        if (mode === currentMode) return;

        currentMode = mode;

        choices.forEach(c => {
            c.classList.remove('selected-shake');
            c.classList.add('fade-out');
        });
        choice.classList.remove('fade-out');
        choice.classList.add('selected-shake');

        storyHook.classList.remove('hidden');
        scrollyCont.classList.remove('hidden');
        scrollPrompt.classList.remove('hidden');

        hookTitle.innerText = `The streets of NYC from a ${mode}'s perspective...`;

        // Suppress the thought bubble until the user actually scrolls to a step
        suppressThought = true;

        // Load first step without showing thought bubble — it appears on scroll
        loadStep(mode, 0, false);
        showCharacter();

        // Give the browser one frame to render the now-visible container,
        // then initialise (or resize) scrollama so it measures positions correctly
        requestAnimationFrame(() => {
            if (!scrollamaReady) {
                initScrollama();
                scrollamaReady = true;
            } else {
                scroller.resize();
            }
        });
    });
});

// ── Scrollama — swap plot and thought on each step ───────────────────────────
function initScrollama() {
    scroller
        .setup({ step: '.step', offset: 0.6, debug: false })
        .onStepEnter(response => {
            response.element.classList.add('is-active');
            const stepIndex = parseInt(response.element.getAttribute('data-step'), 10);
            // First real scroll: lift suppression so the thought bubble can now appear
            suppressThought = false;
            if (currentMode) loadStep(currentMode, stepIndex);
        });
}

window.addEventListener('resize', scroller.resize);
