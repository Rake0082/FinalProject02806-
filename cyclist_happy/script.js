let scrollerInstance = null;

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

let currentMode     = "";
let suppressThought = false;
let isSwitching     = false;

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
            heading: 'The Rhythm of the Day',
            text:    'Rush hour fills the streets — and the collision reports. Cyclist crashes peak sharply between 4 and 6 PM, when commuters flood the city. The pattern is clear: the more people on the road, the more danger for cyclists.<br><br>But the hour of day only tells us when within a single day. What if the danger shifts across the entire year? Does summer bring more cyclists — and more crashes? Let\'s follow the calendar.',
        },
        {
            plot:    'seasonality_cyclist_focus_plot.html',
            title:   'Seasonal Patterns in Cyclist Crashes',
            caption: 'Figure 2: Cyclist crashes as a share of total daily crashes, by month. The summer peak reflects more cyclists on the road — not necessarily more danger per ride.',
            emotion: 'thinking',
            thought: 'More cyclists in summer, more crashes. Honestly? I\'d rather stay home when it snows anyway.',
            heading: 'The Summer Surge',
            text:    'No surprise here — cyclist crashes peak in summer and drop in winter. But with more cyclists on the road in summer, a higher crash count is almost inevitable. Volume isn\'t the same as danger.<br><br>So let\'s shift the lens. Instead of volume, we look at fatalities. And instead of asking when, we ask where — are there parts of NYC where cyclists are systematically more at risk than others?',
        },
        {
            plot:    'bubble_map_cyclist.html',
            title:   'Cyclist Danger Zones — NYC',
            caption: 'Figure 3: Interactive map of cyclist fatal crash clusters across NYC. Each bubble represents a geographic cluster built exclusively from fatal crashes — bubble size reflects the total number of fatal crashes in that cluster, colour reflects fatality rate (light pink = low, dark red = high). Hover over a bubble to see: the nearest intersection, total crashes, fatality rate, year-over-year trend (↑ increasing / → stable / ↓ decreasing), peak crash hour, most common contributing factor, median age of those involved, and borough.',
            emotion: 'surprised',
            thought: 'Find your street. Is it on here?',
            heading: 'Where It Happens',
            text:    'Time of day, time of year — but now it\'s time to ask where. Some intersections in NYC are consistently more dangerous for cyclists than others. Here, it\'s not crash volume that matters — it\'s the fatality rate that determines how dark a spot appears on the map.<br><br>The contrast can be striking. Jay Street &amp; Tillary Street in Brooklyn recorded nearly 11,000 crashes — one of the busiest intersections in the dataset — yet its fatality rate is just 0.30%. But the trend is moving in the wrong direction. Bruckner Boulevard &amp; Rosedale Avenue in the Bronx tells a different story: only 34 crashes, but a fatality rate of 8.82%. Busy doesn\'t mean deadly. Quiet doesn\'t mean safe.<br><br>And if you click around, something familiar emerges: peak hour at the most dangerous spots tends to cluster around 2 to 8 PM — exactly the evening rush we saw at the very beginning. The where and the when are not unrelated.<br><br>But the bubbles reveal more than just location and time. Each intersection comes with a top cause and a median age — and that raises a harder question: is driver inattention actually more likely to turn a crash fatal? Does the age of the cyclist matter? So far we\'ve mapped the crashes — now let\'s look at what\'s behind the fatality rate.',
        },
        {
            plot:    'rf_feature_importance_cyclist.html',
            title:   'What Factors Predict a Fatal Crash?',
            caption: 'Figure 4: Feature importance from a supervised Random Forest classifier trained to predict whether a cyclist involved in a crash was killed or survived. The model combines two NYC Open Data sources — one recording crash details (time, location, vehicle types, contributing factors) and one recording person details (age, sex, safety equipment, ejection status) — linked by a shared collision ID. Features include both time-based variables (hour of day, day of week, month) and person- and crash-level variables (age, borough, primary and secondary vehicle type, contributing factor, sex, safety equipment, ejection status, pedestrian location, and pedestrian action). Bar length reflects how strongly each feature predicts a fatal outcome: the longer the bar, the more predictive the feature.',
            emotion: 'thinking',
            thought: 'So what actually decides whether I make it home?',
            heading: 'What Makes a Crash Fatal?',
            text:    'Not all crashes are equal. Two cyclists can hit the ground at the same intersection and yet face very different odds. So what actually separates a crash from a fatality?<br><br>Ejection status tops the list — no surprise there. Being thrown from the bike is the clearest predictor of a fatal outcome. Age has an enormous impact too: a cyclist over 80 is 46 times more likely to die in a crash than one under 10. Young riders between 11 and 30 are involved in the most crashes by far — but they survive at the highest rates.<br><br>Hour of day shows up as well, confirming what we saw at the start: the trend is clear — timing doesn\'t just affect how many crashes happen, it also affects survival.<br><br>But the third most important factor stands out: vehicle type. Not where you ride, not when you ride — but what hits you. And it turns out, not all vehicles are equally dangerous.',
        },
        {
            plot:    'rf_vehicle_type_cyclist.html',
            title:   'Fatality Rate by Vehicle Type',
            caption: 'Figure 5: Fatality rate by primary vehicle type involved in cyclist crashes. Only the top 12 vehicle types by crash volume are shown, each with a minimum of 50 crashes. Bars show the percentage of crashes involving that vehicle type that resulted in the cyclist\'s death, sorted from least to most deadly. Hover to see the exact fatality rate and total crash count.',
            emotion: 'surprised',
            thought: 'The type of vehicle that hits me changes my odds of surviving?',
            heading: 'Does the Vehicle Matter?',
            text:    'Box trucks top the list by a wide margin with a fatality rate of 4.35% — a cyclist struck by one is far more likely to die than in any other collision. Buses and pick-up trucks follow. The pattern is hard to miss: the heavier the vehicle, the higher the fatality rate. However, these cases are also far less likely to occur.<br><br>Hover over any bar to see both the fatality rate and the number of observations. Station wagons account for the most crashes with 17,365 in total, yet the fatality rate is only 0.26%. Cyclist-on-cyclist collisions are also common — 16,332 observations — with an even lower fatality rate of 0.20%.<br><br>E-bikes land in the middle with a fatality rate of 0.80%, a reminder that the cycling landscape itself is changing.<br><br>But knowing what hits you only tells part of the story. The other part is why it happens at all.',
        },
        {
            plot:    'rf_contributing_factor_cyclist.html',
            title:   'Contributing Factors: Volume vs. Lethality',
            caption: 'Figure 6: Contributing factors for cyclist crashes — how common vs. how lethal. Some causes are frequent but rarely fatal; others are rare but almost always deadly.',
            emotion: 'neutral',
            thought: 'Some of these factors... happen every single day out there.',
            heading: 'Why Do Crashes Happen?',
            text:    'Failure to yield, driver inattention, dooring — the contributing factors behind cyclist crashes tell two different stories: what causes the most crashes, and what causes the deadliest ones.',
        },
    ],
    pedestrian: [
        {
            plot:    'pedestrian_hourly_plot.html',
            title:   'Crashes by Hour of Day',
            caption: 'Hourly distribution of pedestrian-involved collisions in New York City. The data includes all recorded pedestrians involved in a vehicle collision, grouped by the hour of the day (0–23) to show the hourly trend.',
            emotion: 'thinking',
            thought: 'So, the 5 PM rush is a literal headache. Maybe I\'ll just start working from home... or at 3 AM?',
            heading: 'The Rhythm of the Day',
            text:    'The data highlights two notable periods: a slight increase during the morning hours around 08:00, and a more pronounced concentration in the late afternoon and early evening, peaking between 17:00 and 18:00. It is reasonable to suggest that this pattern may be linked to general urban mobility cycles. These peaks align with typical "rush hour" periods when the streets are generally more crowded. Therefore, the higher frequency of incidents in the afternoon does not necessarily mean the environment itself is more "dangerous" at that time; rather, it likely reflects a higher volume of people and vehicles sharing the space.<br><br>While these figures show us when most collisions occur, they represent only one part of the narrative. To better understand the nature of risk in the city, it is also relevant to look at the demographics of those involved—specifically how the outcome of a collision might differ based on gender.',
        },
        {
            plot:    'pedestrian_fatality_by_sex_plot.html',
            title:   'Does Gender Change Your Risk?',
            caption: 'Figure 2: Fatality rate by sex. Given that a crash happened, are men or women more likely to die? The answer differs by how you get around.',
            emotion: 'surprised',
            thought: 'I never thought my gender would be a factor.',
            heading: 'Who Is Most at Risk?',
            text:    'Given that a crash has already happened, does gender influence survival? Across all road users the gap is visible — but for pedestrians, the difference is particularly striking.',
        },
        {
            plot:    'bubble_map_pedestrian.html',
            title:   'Pedestrian Danger Zones — NYC',
            caption: 'Figure 3: Pedestrian danger zones across NYC. Each bubble marks a crash cluster — size shows total crashes, colour shows fatality rate. The deadliest spots are not always where the crowds are.',
            emotion: 'surprised',
            thought: 'I walk these streets every day... I had no idea.',
            heading: 'Where It Happens',
            text:    'Zoom out from time and identity and look at place. Where do pedestrian crashes concentrate across NYC — and are the deadliest clusters the same as the busiest ones?',
        },
        {
            plot:    'rf_feature_importance_pedestrian.html',
            title:   'What Factors Predict a Fatal Crash?',
            caption: 'Figure 4: Feature importance from a supervised Random Forest classifier trained to predict whether a pedestrian involved in a crash was killed or survived. The model combines two NYC Open Data sources — one recording crash details (time, location, vehicle types, contributing factors) and one recording person details (age, sex, safety equipment, ejection status) — linked by a shared collision ID. Features include both time-based variables (hour of day, day of week, month) and person- and crash-level variables (age, borough, primary and secondary vehicle type, contributing factor, sex, safety equipment, ejection status, pedestrian location, and pedestrian action). Bar length reflects how strongly each feature predicts a fatal outcome: the longer the bar, the more predictive the feature.',
            emotion: 'thinking',
            thought: 'So what actually decides whether I make it home?',
            heading: 'What Makes a Crash Fatal?',
            text:    'A machine learning model trained on thousands of collisions ranks the factors that most strongly predict whether a pedestrian crash turns deadly. The results challenge some assumptions.',
        },
        {
            plot:    'rf_vehicle_type_pedestrian.html',
            title:   'Fatality Rate by Vehicle Type',
            caption: 'Figure 5: Fatality rate by vehicle type for pedestrian crashes. Not all vehicles are equally dangerous to a person on foot — what hits you matters.',
            emotion: 'surprised',
            thought: 'The type of vehicle that hits me changes my odds of surviving?',
            heading: 'Does the Vehicle Matter?',
            text:    'When a pedestrian is struck, does it matter what kind of vehicle hit them? The fatality rate varies sharply by vehicle type — and some results are hard to ignore.',
        },
        {
            plot:    'rf_ped_action.html',
            title:   'What Were You Doing When It Happened?',
            caption: 'Figure 6: Fatality rate by pedestrian action at time of crash. Crossing with the signal, jaywalking, or standing still — each carries a different survival rate.',
            emotion: 'thinking',
            thought: 'Could I have done something differently?',
            heading: 'Does Your Action Matter?',
            text:    'Crossing with the signal, jaywalking, or standing still — does what a pedestrian was doing at the moment of impact affect whether they survive? The data reveals striking differences.',
        },
        {
            plot:    'rf_contributing_factor_pedestrian.html',
            title:   'Contributing Factors: Volume vs. Lethality',
            caption: 'Figure 7: Contributing factors for pedestrian crashes — how common vs. how lethal. Some causes are frequent but rarely fatal; others are rare but almost always deadly.',
            emotion: 'neutral',
            thought: 'Some of these factors... happen every single day.',
            heading: 'Why Do Crashes Happen?',
            text:    'Failure to yield, driver inattention, traffic control disregarded — the contributing factors behind pedestrian crashes tell two different stories: what causes the most crashes, and what causes the deadliest ones.',
        },
    ],
    motorist: [
        {
            plot:    'motorist_hourly_plot.html',
            title:   'Crashes by Hour of Day',
            caption: 'Figure 1: Motorist crashes by hour of day. Rush hour dominates crash volume — but the deadliest crashes happen long after traffic has cleared.',
            emotion: 'thinking',
            thought: 'Rush hour is stressful, but is it actually the most dangerous?',
            heading: 'The Rhythm of the Day',
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
            caption: 'Figure 5: Feature importance from a supervised Random Forest classifier trained to predict whether a motorist involved in a crash was killed or survived. The model combines two NYC Open Data sources — one recording crash details (time, location, vehicle types, contributing factors) and one recording person details (age, sex, safety equipment, ejection status) — linked by a shared collision ID. Features include both time-based variables (hour of day, day of week, month) and person- and crash-level variables (age, borough, primary and secondary vehicle type, contributing factor, sex, safety equipment, ejection status, pedestrian location, and pedestrian action). Bar length reflects how strongly each feature predicts a fatal outcome: the longer the bar, the more predictive the feature.',
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
            emotion: 'neutral',
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
            ${step.text ? `<p>${step.text}</p>` : ''}
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

    // Show ending section after the last step
    const isLast = stepIndex === STORY[mode].length - 1;
    const storyEnding = document.getElementById('story-ending');
    if (isLast) {
        document.querySelectorAll('.ending-summary').forEach(el => el.classList.add('hidden'));
        const active = document.querySelector(`.ending-summary[data-persona="${mode}"]`);
        if (active) active.classList.remove('hidden');
        storyEnding.classList.remove('hidden');
        // Hide thought bubble only once the ending section scrolls into view
        const obs = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting) {
                setThought(null);
                obs.disconnect();
            }
        }, { threshold: 0.1 });
        obs.observe(storyEnding);
    } else {
        storyEnding.classList.add('hidden');
    }
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
    document.getElementById('story-ending').classList.add('hidden');
}

document.getElementById('restart-btn').addEventListener('click', () => {
    resetSelection();
    window.scrollTo({ top: 0, behavior: 'smooth' });
});


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

        hookTitle.innerText = `The streets of NYC from a ${mode}'s perspective`;
        if (HOOK[mode]) {
            hookNumber.textContent = HOOK[mode].stat;
            hookLabel.textContent  = HOOK[mode].label;
        }

        // Suppress the thought bubble until the user actually scrolls to a step
        suppressThought = true;
        isSwitching = true;

        // Hide ending section from previous persona
        document.getElementById('story-ending').classList.add('hidden');

        // Render the correct text steps for this persona
        renderSteps(mode);

        // Load first step without showing thought bubble — it appears on scroll
        loadStep(mode, 0, false);
        showCharacter();

        // Scroll to the story hook so user starts from the top of the new story
        storyHook.scrollIntoView({ behavior: 'smooth', block: 'start' });

        // Re-init scrollama on a fresh instance so new steps are observed cleanly
        requestAnimationFrame(() => {
            initScrollama();
            // Release block after scroll has settled
            setTimeout(() => { isSwitching = false; }, 1200);
        });
    });
});

// ── Scrollama — swap plot and thought on each step ───────────────────────────
function initScrollama() {
    if (scrollerInstance) {
        try { scrollerInstance.destroy(); } catch (e) {}
    }
    scrollerInstance = scrollama();
    scrollerInstance
        .setup({ step: '.step', offset: 0.6, debug: false })
        .onStepEnter(response => {
            if (isSwitching) return;
            document.querySelectorAll('.step').forEach(s => s.classList.remove('is-active'));
            response.element.classList.add('is-active');
            const stepIndex = parseInt(response.element.getAttribute('data-step'), 10);
            suppressThought = false;
            if (currentMode) loadStep(currentMode, stepIndex);
        });
}

window.addEventListener('resize', () => { if (scrollerInstance) scrollerInstance.resize(); });
