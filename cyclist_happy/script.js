const scroller = scrollama();

const choices       = document.querySelectorAll('.choice');
const scrollPrompt  = document.getElementById('scroll-prompt');
const storyHook     = document.getElementById('story-hook');
const scrollyCont   = document.getElementById('scrolly-container');
const plotFrame     = document.getElementById('plot-frame');
const plotCaption   = document.getElementById('plot-caption');
const plotTitle     = document.getElementById('plot-title');
const progressEl    = document.getElementById('step-progress');
const floatingChar  = document.getElementById('floating-char');
const floatingImg   = document.getElementById('floating-char-img');
const thoughtBubble = document.getElementById('thought-bubble');
const thoughtText   = document.getElementById('thought-text');
const hookTitle     = document.getElementById('hook-title');
const hookNumber    = document.getElementById('hook-number');
const hookLabel     = document.getElementById('hook-label');
const changeBtn     = document.getElementById('change-btn');

let currentMode    = "";
let scrollamaReady = false;
let suppressThought = false; // true while we want to block the bubble

// ── Big hook stat per persona ────────────────────────────────────────────────
const HOOK = {
    cyclist:    { stat: '13,000+',  label: 'cyclists injured in NYC between 2012–2023' },
    pedestrian: { stat: '57,000+',  label: 'pedestrians struck by vehicles in NYC since 2012' },
    motorist:   { stat: '1.5M+',    label: 'motorist crashes recorded in NYC since 2012' },
};

// ── Story content per persona and step ──────────────────────────────────────
// Each step defines which plot to show, a figure caption, character emotion,
// and the thought bubble text shown next to the character.
const STORY = {
    cyclist: [
        {
            plot:    'cyclist_hourly_plot.html',
            title:   'Crashes by Hour of Day',
            caption: 'Figure 1: Cyclist crashes by hour of day. The evening rush (16–18h) sees the highest volume, but late-night crashes carry a disproportionately high fatality rate.',
            emotion: 'thinking',
            thought: 'Rush hour... that\'s when cars stop looking out for me.',
            heading: 'The Rhythm of the Streets',
            text:    'When do crashes actually happen? Looking at cyclist collisions hour by hour, a clear pattern emerges around the evening rush — and the fatality rate tells a different story.',
        },
    ],
    pedestrian: [
        {
            plot:    'pedestrian_hourly_plot.html',
            title:   'Crashes by Hour of Day',
            caption: 'Figure 1: Pedestrian crashes by hour of day. Most crashes happen during the evening commute, but midnight hours are when a single crash is most likely to be fatal.',
            emotion: 'thinking',
            thought: 'I thought daytime was safe... the data says otherwise.',
            heading: 'The Rhythm of the Streets',
            text:    'When do crashes actually happen? For pedestrians, the evening commute dominates — but the deadliest crashes happen long after the crowds have gone home.',
        },
        {
            plot:    'rf_sex_fatality.html',
            title:   'Does Gender Change Your Risk?',
            caption: 'Figure 2: Fatality rate by sex. Given that a crash happened, are men or women more likely to die? The answer differs by how you get around.',
            emotion: 'surprised',
            thought: 'I never thought my gender would be a factor.',
            heading: 'Who Is Most at Risk?',
            text:    'Given that a crash has already happened, does gender influence survival? Across all road users the gap is visible — but for pedestrians, the difference is particularly striking.',
        },
    ],
    motorist: [
        {
            plot:    'motorist_hourly_plot.html',
            title:   'Crashes by Hour of Day',
            caption: 'Figure 1: Motorist crashes by hour of day. Rush hour dominates crash volume — but the deadliest crashes happen long after traffic has cleared.',
            emotion: 'thinking',
            thought: 'Rush hour is stressful, but is it actually the most dangerous?',
            heading: 'The Rhythm of the Streets',
            text:    'When do crashes actually happen? Looking at collisions hour by hour, a clear pattern emerges — and it may not be what you\'d expect.',
        },
        {
            plot:    'risk_vs_reality_motorist_plot.html',
            title:   'Risk vs. Reality',
            caption: 'Figure 2: Risk vs. reality for motorists. Crash volume and fatality rate tell very different stories — the hours you worry about may not be the ones that should worry you.',
            emotion: 'surprised',
            thought: 'Wait — late at night is when I\'m really at risk?',
            heading: 'Risk vs. Reality — Are You as Safe as You Think?',
            text:    'Motorists make up the majority of road users — but does that mean they bear the most risk? This chart separates how common crashes are from how deadly they actually are.',
        },
        {
            plot:    'weather_effect_motorist_plot.html',
            title:   'Weather Effect on Daily Crashes',
            caption: 'Figure 3: Weather and motorist crashes. Winter storm days see far more crashes on average than clear days — slippery roads and reduced visibility change the game.',
            emotion: 'scared',
            thought: 'Snow days feel dangerous... and the data backs me up.',
            heading: 'When the Weather Turns',
            text:    'You already drive more carefully in snow — but does it help? Winter storm days with road salt use see a dramatic spike in average daily crashes compared to clear conditions.',
        },
        {
            plot:    'bubble_map_motorist.html',
            title:   'Motorist Danger Zones — NYC',
            caption: 'Figure 4: Motorist danger zones across NYC. Each bubble marks a crash cluster — size shows total crashes, colour shows fatality rate. The deadliest spots are not always the busiest.',
            emotion: 'surprised',
            thought: 'I drive these streets every day... I had no idea.',
            heading: 'Where It Happens',
            text:    'Zoom out from time and look at place. These clusters show where motorist crashes concentrate across NYC — and where the fatal ones tend to land may surprise you.',
        },
        {
            plot:    'rf_feature_importance_motorist.html',
            title:   'What Factors Predict a Fatal Crash?',
            caption: 'Figure 5: What predicts a fatal motorist crash? A Random Forest model ranks the most important factors — some are obvious, others are not.',
            emotion: 'thinking',
            thought: 'So what actually decides whether I make it home?',
            heading: 'What Makes a Crash Fatal?',
            text:    'A machine learning model trained on thousands of collisions ranks the factors that most strongly predict whether a motorist crash turns deadly. The results challenge some assumptions.',
        },
        {
            plot:    'rf_vehicle_type_motorist.html',
            title:   'Fatality Rate by Vehicle Type',
            caption: 'Figure 6: Fatality rate by vehicle type. Not all vehicles carry equal risk — what you\'re driving matters more than you might think.',
            emotion: 'surprised',
            thought: 'The type of car I\'m in changes my odds?',
            heading: 'Does Your Vehicle Matter?',
            text:    'Behind the wheel of a sedan, a truck, or a motorcycle — does it change your risk? The fatality rate varies sharply by vehicle type, and some results are hard to ignore.',
        },
        {
            plot:    'rf_contributing_factor_motorist.html',
            title:   'Contributing Factors: Volume vs. Lethality',
            caption: 'Figure 7: Contributing factors — how common vs. how lethal. Some causes are frequent but rarely fatal; others are rare but almost always deadly.',
            emotion: 'scared',
            thought: 'Some of these factors... I\'ve been guilty of them myself.',
            heading: 'Why Do Crashes Happen?',
            text:    'Driver distraction, speeding, failing to yield — the contributing factors behind motorist crashes tell two different stories: what causes the most crashes, and what causes the deadliest ones.',
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

// ── Render scrollable text steps for the chosen persona ──────────────────────
function renderSteps(mode) {
    const article = document.querySelector('.scroll-text');
    article.innerHTML = (STORY[mode] || []).map((step, i) => `
        <div class="step" data-step="${i}">
            <h3>${step.heading}</h3>
            <p>${step.text}</p>
        </div>
    `).join('');
}

// ── Progress dots ────────────────────────────────────────────────────────────
function updateProgress(mode, stepIndex) {
    const total = STORY[mode]?.length || 0;
    progressEl.innerHTML = Array.from({ length: total }, (_, i) =>
        `<span class="prog-dot${i === stepIndex ? ' active' : ''}"></span>`
    ).join('');
}

// ── Load a story step ────────────────────────────────────────────────────────
function loadStep(mode, stepIndex, showThought = true) {
    const steps = STORY[mode];
    if (!steps) return;
    const step = steps[stepIndex] || steps[steps.length - 1];

    // Fade iframe out, swap src, fade back in
    plotFrame.style.opacity = '0';
    setTimeout(() => {
        plotFrame.src = step.plot;
        const fadeIn = () => { plotFrame.style.opacity = '1'; };
        plotFrame.onload = fadeIn;
        setTimeout(fadeIn, 700); // fallback if onload doesn't fire
    }, 200);

    plotTitle.textContent   = step.title || '';
    plotCaption.textContent = step.caption;
    setCharacter(mode, step.emotion);
    if (showThought) setThought(step.thought);
    updateProgress(mode, stepIndex);
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
        if (HOOK[mode]) {
            hookNumber.textContent = HOOK[mode].stat;
            hookLabel.textContent  = HOOK[mode].label;
        }

        // Suppress the thought bubble until the user actually scrolls to a step
        suppressThought = true;

        // Render the correct text steps for this persona
        renderSteps(mode);

        // Load first step without showing thought bubble — it appears on scroll
        loadStep(mode, 0, false);
        showCharacter();

        // Re-setup scrollama after the new step elements are in the DOM
        requestAnimationFrame(() => {
            if (!scrollamaReady) {
                initScrollama();
                scrollamaReady = true;
            } else {
                // Re-setup picks up new DOM steps; handler stays attached
                scroller.setup({ step: '.step', offset: 0.6, debug: false });
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
            document.querySelectorAll('.step').forEach(s => s.classList.remove('is-active'));
            response.element.classList.add('is-active');
            const stepIndex = parseInt(response.element.getAttribute('data-step'), 10);
            suppressThought = false;
            if (currentMode) loadStep(currentMode, stepIndex);
        });
}

window.addEventListener('resize', scroller.resize);
