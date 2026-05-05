const scroller = scrollama();

const choices = document.querySelectorAll('.choice');
const scrollPrompt = document.getElementById('scroll-prompt');
const storyHook = document.getElementById('story-hook');
const scrollyContainer = document.getElementById('scrolly-container');

const plotFrame = document.getElementById('plot-frame');
const happyCharImg = document.getElementById('happy-char-img');
const hookTitle = document.getElementById('hook-title');

let currentMode = "";

choices.forEach(choice => {
    choice.addEventListener('click', () => {
        currentMode = choice.getAttribute('data-perspective');

        // 1. Feedback på klik
        choices.forEach(c => c.classList.add('fade-out'));
        choice.classList.remove('fade-out');
        choice.classList.add('selected-shake');

        // 2. Fjern hidden klasser med det samme
        storyHook.classList.remove('hidden');
        scrollyContainer.classList.remove('hidden');
        scrollPrompt.classList.remove('hidden');

        // 3. Forbered indholdet
        prepareContent(currentMode);
        
        // 4. Start Scrollama
        initScrollama();
    });
});

function prepareContent(mode) {
    // Sæt plottet (motorist_hourly_plot.html findes i din liste)
    plotFrame.src = `${mode}_hourly_plot.html`;

    // Sæt karakteren (hvis det er motorist, skal vi bruge driver filen)
    let filePrefix = mode === "motorist" ? "driver" : mode;
    happyCharImg.src = `${filePrefix}_happy.svg`;

    // Opdater overskrift i hook
    hookTitle.innerText = `The streets of NYC from a ${mode}'s perspective...`;
}

function initScrollama() {
    scroller
        .setup({
            step: ".step",
            offset: 0.7,
            debug: false
        })
        .onStepEnter(response => {
            response.element.classList.add("is-active");
            console.log("Enter:", response.index);
        });
}

window.addEventListener("resize", scroller.resize);