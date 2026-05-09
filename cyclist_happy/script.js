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
const hookText      = document.getElementById('hook-text');

let currentMode     = "";
let suppressThought = false;
let isSwitching     = false;

// ── Big hook stat per persona ────────────────────────────────────────────────
const HOOK = {
    cyclist:    { stat: '80,215',    label: 'cyclists involved in motor vehicle collisions since 2012',   text: 'Motor vehicle collisions are not accidents — they are the result of a complex interplay of variables, each contributing to an incident in ways that can be measured, understood, and often prevented. Let us explore those reasons through data and see what patterns emerge from a cyclist\'s point of view.' },
    pedestrian: { stat: '146,845',  label: 'pedestrians involved in motor vehicle collisions since 2012', text: 'Motor vehicle collisions are not accidents — they are the result of a complex interplay of variables, each contributing to an incident in ways that can be measured, understood, and often prevented. Let us explore those reasons through data and see what patterns emerge from a pedestrian\'s point of view.' },
    motorist:   { stat: '5,705,877', label: 'motorists involved in motor vehicle collisions since 2012',  text: 'Motor vehicle collisions are not accidents — they are the result of a complex interplay of variables, each contributing to an incident in ways that can be measured, understood, and often prevented. Let us explore those reasons through data and see what patterns emerge from a motorist\'s point of view.' },
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
            caption: 'Figure 6: Contributing factors for cyclist collisions, comparing total crash volume against the fatality rate per incident. This visualization distinguishes between high-frequency behavioral errors and high-lethality risks.',
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
            caption: 'Figure 1: Hourly distribution of pedestrian-involved collisions in New York City. The data includes all recorded pedestrians involved in a vehicle collision, grouped by the hour of the day (0–23) to show the hourly trend.',
            emotion: 'thinking',
            thought: 'So, the 5 PM rush is a literal headache. Maybe I\'ll just start working from home... or at 3 AM?',
            heading: 'The Rhythm of the Day',
            text:    'The data highlights two notable periods: a slight increase during the morning hours around 08:00, and a more pronounced concentration in the late afternoon and early evening, peaking between 17:00 and 18:00. It is reasonable to suggest that this pattern may be linked to general urban mobility cycles. These peaks align with typical "rush hour" periods when the streets are generally more crowded. Therefore, the higher frequency of incidents in the afternoon does not necessarily mean the environment itself is more "dangerous" at that time; rather, it likely reflects a higher volume of people and vehicles sharing the space.<br><br>While these figures show us when most collisions occur, they represent only one part of the narrative. To better understand the nature of risk in the city, it is also relevant to look at the demographics of those involved—specifically how the outcome of a collision might differ based on gender.',
        },
        {
            plot:    'pedestrian_fatality_by_sex_plot.html',
            title:   'Fatality Rate by Sex',
            caption: 'Figure 2: Fatality rate per 1,000 individuals involved, compared by sex. The data shows that while both genders are involved in collisions at nearly the same rate, the likelihood of a fatal outcome is higher for males.',
            emotion: 'surprised',
            thought: 'Equal representation in the streets, but men are clearly winning the race no one wants to lead.',
            heading: 'Who Is Most at Risk?',
            text:    'When examining the demographics of pedestrian collisions in New York City, the distribution between genders is remarkably balanced, with females accounting for 50.6% and males for 49.4% of those involved. This near-equal split provides a solid baseline for comparing the fatality rates between the two groups.<br><br>While the involvement rate is almost identical, the outcome of these collisions tells a different story. The data shows a clear disparity: the fatality rate for men is significantly higher than for women. This suggests that even though both genders are involved in vehicle collisions at similar frequencies, the incidents involving men are statistically more likely to result in a fatal outcome.',
        },
        {
            plot:    'bubble_map_pedestrian.html',
            title:   'Pedestrian Danger Zones — NYC',
            caption: 'Figure 3: Spatial clustering of pedestrian-involved collisions in New York City. Clusters are formed using a machine learning algorithm that groups incidents within a 200-meter radius. Each cluster displays specific features, including the pedestrian fatality rate, borough, and the top cause of the accidents.',
            emotion: 'surprised',
            thought: 'I walk these streets every day... I had no idea.',
            heading: 'Where It Happens',
            text:    'While time and demographics provide critical context, the geography of risk is perhaps the most actionable element of traffic safety. We invite you to interact with the map to explore the spatial distribution of pedestrian collisions across New York City. By zooming in and navigating the different boroughs, you can see how accidents are not evenly dispersed but instead form high-density clusters.<br><br>The visualization reveals that certain intersections and corridors are significantly more hazardous than others. While many areas show a high frequency of incidents (indicated by bubble size), some of the most concerning "danger zones" are defined by their elevated fatality rates (indicated by color). These hotspots often emerge along major transit arteries and complex intersections where high-speed vehicular traffic meets heavy pedestrian volume. Exploring these clusters allows us to move from city-wide statistics to the specific streets where the margin for error is smallest.',
        },
        {
            plot:    'rf_feature_importance_pedestrian.html',
            title:   'Key Factors in Fatal Pedestrian Collisions',
            caption: 'Figure 4: Feature importance from a supervised Random Forest classifier trained to predict whether a pedestrian involved in a crash was killed or survived. The model combines two NYC Open Data sources — one recording crash details (time, location, vehicle types, contributing factors) and one recording person details (age, sex, safety equipment, ejection status) — linked by a shared collision ID. Features include both time-based variables (hour of day, day of week, month) and person- and crash-level variables (age, borough, primary and secondary vehicle type, contributing factor, sex, safety equipment, ejection status, pedestrian location, and pedestrian action). Bar length reflects how strongly each feature predicts a fatal outcome: the longer the bar, the more predictive the feature.',
            emotion: 'thinking',
            thought: 'So I can\'t stop getting older, but I can definitely rethink how I cross the street.',
            heading: 'What Makes a Crash Fatal?',
            text:    'This analysis identifies the primary factors that determine whether a pedestrian collision results in a fatality. The results reveal a complex interplay between variables we can influence and those we cannot, highlighting where the greatest risks lie.<br><br>A primary predictor is Age. This is largely due to the physical vulnerability associated with older age; while our data suggests that younger individuals are involved in crashes more frequently, these incidents are statistically far more fatal for older pedestrians. Similarly, the Hour of Day remains a critical factor, reinforcing the temporal patterns we observed earlier in the city\'s daily rhythm.<br><br>However, the model also highlights factors where individual behavior and external physics play a decisive role. Pedestrian Action—what a person is doing at the moment of impact—stands out as a significant predictor that is often within one\'s own control. Conversely, Vehicle Type reminds us that the sheer size and nature of the vehicle involved heavily dictates the chance of survival.<br><br>To better understand these dynamics, we will dive deeper into how our own actions and the vehicles we share the road with shape the outcome of a crash.',
        },
        {
            plot:    'rf_vehicle_type_pedestrian.html',
            title:   'Fatality Rate by Vehicle Type',
            caption: 'Figure 5: Fatality rate by vehicle type for pedestrian crashes. Not all vehicles are equally dangerous to a person on foot — what hits you matters.',
            emotion: 'surprised',
            thought: 'It makes sense that mass matters, but seeing the jump in fatality rates for buses and trucks is still eye-opening.',
            heading: 'Does the Vehicle Matter?',
            text:    'This chart illustrates the fatality rate for pedestrians based on the primary type of vehicle involved in the collision. To get a more detailed view, you can hover your cursor over each bar to see the specific fatality rate and the total number of individuals involved in each category.<br><br>The data highlights a stark physical reality: pedestrians are small and entirely unprotected when facing large, heavy machinery. While standard passenger cars like Sedans and Taxis are involved in a high number of total incidents, they have some of the lowest fatality rates. In contrast, being struck by a Box Truck or a Bus is significantly more dangerous. The sheer mass and height of these larger vehicles mean that when a collision occurs, the outcome is far more likely to be fatal.',
        },
        {
            plot:    'rf_ped_action.html',
            title:   'Fatality Rate by Pedestrian Action',
            caption: 'Figure 6: Fatality rate by pedestrian action at time of crash. Crossing with the signal, jaywalking, or standing still — each carries a different survival rate.',
            emotion: 'thinking',
            thought: 'It makes me think about how much of my safety depends on my own actions versus how well the street is designed to protect me.',
            heading: 'What Is Behind the Pedestrian\'s Action?',
            text:    'This visualization explores the relationship between pedestrian behavior at the time of impact and the resulting survival rate. To see the specific data behind each category, you can hover your cursor over the bars to view the total number of incidents and the exact fatality percentage.<br><br>The data indicates that certain high-risk maneuvers, such as walking along a highway against traffic, carry an exceptionally high fatality rate compared to standard urban movements. From an analytical perspective, actions that deviate from established traffic regulations—such as crossing against a signal or being in prohibited areas—significantly increase the severity of a crash.<br><br>However, these patterns also raise important questions about urban design. When non-compliant behavior occurs frequently in specific areas, it may suggest that the current infrastructure does not align with natural pedestrian flow. This is where initiatives like Vision Zero become essential; by using this data, the city can identify whether a "risky" action is a result of individual choice or a sign that a street needs to be redesigned to prioritize human safety over vehicular speed.',
        },
        {
            plot:    'rf_contributing_factor_pedestrian.html',
            title:   'Contributing Factors: Volume vs. Lethality',
            caption: 'Figure 7: Contributing factors for pedestrian collisions, comparing total crash volume against the fatality rate per incident. This visualization distinguishes between high-frequency behavioral errors and high-lethality risks.',
            emotion: 'neutral',
            thought: 'It makes me realize that \'prevention\' means two different things: stopping the everyday crashes and stopping the deadly ones.',
            heading: 'Common vs. Deadly: Two Different Problems to Solve',
            text:    'This analysis examines the contributing factors behind collisions, specifically comparing their frequency (Volume) against their severity (Lethality). As identified in our predictive model, the specific behavior of the driver is one of the most critical indicators of whether a crash will result in a fatality.<br><br>The data tells two very different stories. Factors such as Unsafe Speed and Alcohol Involvement have a relatively low volume, but they are among the most lethal. When these factors are present, the likelihood of a pedestrian surviving the impact drops significantly. Conversely, the most common factors — Driver Inattention and Failure to Yield Right-of-Way — occur with much higher frequency but have lower individual fatality rates. Because they happen so often, however, they still represent a massive portion of the city\'s total collisions.<br><br>This distinction is vital for safety prevention. To reach the goal of zero fatalities, enforcement and design must target high-lethality behaviors like speeding. At the same time, to reduce the total number of accidents across the city, we must address the frequent, everyday errors like inattention through better intersection design and public awareness.',
        },
    ],
    motorist: [
        {
            plot:    'motorist_hourly_plot.html',
            title:   'Crashes by Hour of Day',
            caption: 'Figure 1: Hourly distribution of motorist-involved collisions in New York City. The data includes all recorded motorists involved in a vehicle collision, grouped by the hour of the day (0–23) to show the hourly trend.',
            emotion: 'thinking',
            thought: 'Rush hour is stressful, but is it actually the most dangerous?',
            heading: 'The Rhythm of the Day',
            text:    'The data highlights two notable periods: a concentration during the morning commute around 08:00, and a more pronounced peak in the late afternoon and early evening, between 17:00 and 18:00. This pattern closely follows the rhythm of urban traffic — these hours correspond to the busiest periods on NYC roads, when the greatest number of vehicles are in circulation. Therefore, the higher frequency of collisions during these windows does not necessarily indicate that driving is inherently more dangerous at these times; rather, it reflects the sheer volume of vehicles sharing the road simultaneously.<br><br>While these figures reveal when most collisions occur, timing is only one dimension of the story. Behind each collision lies a combination of contributing factors — from vehicle type to driver behavior. To understand the true nature of motorist risk, we must look beyond the clock and examine the forces that shape the outcome of a crash.',
        },
        {
            plot:    'risk_vs_reality_motorist_plot.html',
            title:   'Risk vs. Reality',
            caption: 'Figure 2: Percentage of daily motorist collisions (solid line) overlaid with sampled traffic volume (dashed line), both expressed as a share of the daily total, by hour of day (0–23). The shaded area marks hours where the collision share exceeds the traffic volume share. Note: traffic volume data is based on sampled counts and serves as an approximation of general flow patterns, not an exact measure.',
            emotion: 'surprised',
            thought: 'Data is complex — we always need to think about the underlying patterns.',
            heading: 'More Traffic, More Crashes — But Not in Equal Measure',
            text:    'The collision distribution across the day closely mirrors the underlying traffic volume — both rise during the morning commute and peak in the late afternoon. This alignment suggests that the number of crashes at any given hour is, to a significant degree, a function of how many vehicles are on the road. In that sense, the afternoon peak is not inherently more dangerous: it is simply busier.<br><br>However, the visualization reveals something more nuanced. During the afternoon hours, the shaded area — marking "Disproportionate Danger" — indicates that the share of daily collisions exceeds the share of traffic volume at those same hours. In other words, while the afternoon sees more traffic, which partly explains the higher crash count, the collision rate climbs even faster than the traffic does. This suggests that heavy traffic conditions may themselves be a contributing factor: congestion, time pressure, frequent lane changes, and driver frustration can all elevate the likelihood of a collision beyond what volume alone would predict.<br><br>The takeaway is not simply that more cars mean more crashes. It is that the relationship between traffic density and collision risk is not linear — and that the afternoon hours carry a disproportionate share of the total daily crash burden.',
        },
        {
            plot:    'weather_effect_motorist_plot.html',
            title:   'Weather Effect on Daily Crashes',
            caption: 'Figure 3: Average number of daily motorist-involved collisions on clear/normal days compared to winter storm days, identified by road salt usage in NYC. Salt usage data is used as a proxy for days with snow or ice on the roads, sourced from NYC Department of Sanitation records.',
            emotion: 'scared',
            thought: 'I knew snow days felt more dangerous — now I have the numbers to prove it.',
            heading: 'When the Weather Turns',
            text:    'Beyond the time of day and traffic volume, weather is another underlying factor worth examining — one we know can have a direct influence on driving conditions and collision risk.<br><br>The data used here does not contain direct weather measurements. Instead, days with road salt usage — recorded by the NYC Department of Sanitation — serve as a proxy for days with snow or ice on the roads. This means that milder forms of bad weather, such as rain or fog, are not captured by this measure. That said, the signal from the data is clear: on days when salt is used, the average number of daily motorist collisions rises from 302 to 380 — an increase of roughly 26%. Even given the limitation of the proxy, the pattern is consistent and worth taking seriously.',
        },
        {
            plot:    'bubble_map_motorist.html',
            title:   'Motorist Danger Zones — NYC',
            caption: 'Figure 4: Spatial clustering of motorist-involved collisions in New York City. Clusters are formed using a machine learning algorithm that groups incidents within a 200-meter radius. Each cluster displays specific features, including the motorist fatality rate, borough, and the top cause of the accidents.',
            emotion: 'surprised',
            thought: 'Can you find the street where you live?',
            heading: 'Where It Happens',
            text:    'Having established when collisions occur and how traffic volume shapes that pattern, we now turn to where. More importantly, this is also where we shift our focus toward fatality — the measure that captures the true human cost of a collision, and the same metric that sits at the core of New York City\'s Vision Zero initiative, which aims to eliminate all traffic deaths in the city.<br><br>Hovering over the bubbles on the map reveals a clear geographic pattern. The boroughs of Brooklyn and Manhattan concentrate the highest number of collisions — reflected in the larger bubble sizes — yet many of these clusters display relatively low fatality rates, indicated by lighter colors. Staten Island presents a markedly different picture: collision volumes are lower, but several clusters there carry some of the highest fatality rates in the dataset, shown in darker red. Crash volume and crash severity are not the same thing, and the map makes that distinction visible.<br><br>The spatial distribution also reinforces what we observed earlier in time: the where and the when are not independent. Hovering over individual clusters shows that peak crash hours at many of the more dangerous locations align with the evening rush identified at the start of this story.<br><br>The map tells us where the risk concentrates — but not why some crashes turn fatal and others do not. That is the question we examine next.',
        },
        {
            plot:    'rf_feature_importance_motorist.html',
            title:   'What Factors Predict a Fatal Crash?',
            caption: 'Figure 5: Feature importance from a supervised Random Forest classifier trained to predict whether a motorist involved in a crash was killed or survived. The model combines two NYC Open Data sources — one recording crash details (time, location, vehicle types, contributing factors) and one recording person details (age, sex, safety equipment, ejection status) — linked by a shared collision ID. Features include both time-based variables (hour of day, day of week, month) and person- and crash-level variables (age, borough, primary and secondary vehicle type, contributing factor, sex, safety equipment, ejection status, pedestrian location, and pedestrian action). Bar length reflects how strongly each feature predicts a fatal outcome: the longer the bar, the more predictive the feature.',
            emotion: 'thinking',
            thought: 'Good thing I always have my seatbelt on — the data says it really does matter.',
            heading: 'What Makes a Crash Fatal?',
            text:    'This analysis identifies the primary factors that determine whether a motorist collision results in a fatality. The results reveal a combination of variables we can control and those that depend on the physics of the crash itself.<br><br>The leading predictor is Ejection Status — whether the driver or passenger is thrown from the vehicle during the collision. This is physically intuitive: being ejected from a car dramatically reduces the protection offered by the vehicle\'s structure and is among the most dangerous outcomes of any crash. Closely behind is Safety Equipment, which in this context largely reflects seatbelt use. The data confirms what road safety campaigns have long argued: wearing a seatbelt is one of the most decisive factors in surviving a crash. Together, these two variables tell a consistent story — staying inside the vehicle and restrained significantly improves your odds.<br><br>Sex and Contributing Factor also appear as meaningful predictors, suggesting that behavioral patterns and the specific circumstances of the crash play a role in determining severity — though their individual contribution is smaller than the physical factors above.<br><br>Vehicle Type rounds out the key predictors, reminding us that not all vehicles carry the same level of risk. This factor is significant enough that it deserves a closer look — which is exactly what comes next.',
        },
        {
            plot:    'rf_vehicle_type_motorist.html',
            title:   'Fatality Rate by Vehicle Type',
            caption: 'Figure 6: Fatality rate per 1,000 motorists involved, by primary vehicle type. Only vehicle types with a sufficient number of recorded incidents are included. Hover over each bar to see the exact fatality rate and total number of individuals involved in that category.',
            emotion: 'surprised',
            thought: 'My car is my shield.',
            heading: 'Does Your Vehicle Matter?',
            text:    'This chart illustrates the fatality rate for motorists based on the primary vehicle they were driving at the time of the collision. You can hover over each bar to see the specific fatality rate and the total number of individuals involved in each category.<br><br>The most striking result is the dominance of Motorcycles at the top of the chart. With a fatality rate of 1.09%, motorcycles stand far apart from every other vehicle type — and the reason is straightforward: motorcyclists have no protective shell around them. In that sense, a motorcyclist is closer in vulnerability to a pedestrian or cyclist than to a car driver. The vehicle body is precisely what keeps most motorists safe in a collision, and removing it changes the risk entirely.<br><br>This becomes even clearer when comparing across road user types. For pedestrians, the fatality rate when struck by a Box Truck reaches 5.45%. For a motorist inside a vehicle involved in the same type of collision, that figure drops to just 0.01%. The car body absorbs the impact in a way the human body simply cannot.<br><br>Even the highest motorist fatality rate — motorcycles at 1.09% — remains well below the rates faced by unprotected road users. The data makes one thing clear: the greatest protective factor for a motorist is the vehicle itself.',
        },
        {
            plot:    'rf_contributing_factor_motorist.html',
            title:   'Contributing Factors: Volume vs. Lethality',
            caption: 'Figure 7: Contributing factors for motorist collisions, comparing total crash volume against the fatality rate per incident. This visualization distinguishes between high-frequency behavioral errors and high-lethality risks.',
            emotion: 'neutral',
            thought: 'Some of these factors... I\'ve been guilty of them myself.',
            heading: 'Common vs. Deadly: Two Different Problems to Solve',
            text:    'This analysis examines the contributing factors behind motorist collisions, specifically comparing their frequency (Volume) against their severity (Lethality). As identified in our predictive model, driver behavior is one of the most critical indicators of whether a crash will result in a fatality.<br><br>The data tells two very different stories. Unsafe Speed and Traffic Control Disregarded have a relatively low crash volume, but they are the most lethal factors in the dataset. When speeding is involved, the fatality rate for motorists reaches 0.32% — the highest of any contributing factor in this group. That figure may seem small, but it is striking when placed in context: for pedestrians struck by a speeding vehicle, the equivalent fatality rate is 3.37% — more than ten times higher. The same behavior behind the wheel carries vastly different consequences depending on who bears the impact. Conversely, Driver Inattention and Distraction is by far the most common factor, yet its individual fatality rate is much lower. Because it occurs so frequently, however, it still accounts for a massive share of the city\'s total collisions.<br><br>This distinction points toward a clear policy conclusion. To reduce total crash volume, the most effective interventions target everyday behavioral errors like inattention — through better intersection design, clearer signage, and public awareness. But to reduce fatalities, the focus must shift to the high-lethality behaviors: speeding and disregarding traffic controls. These are precisely the behaviors that infrastructure can address directly — through speed bumps, reduced speed limits, redesigned junctions, and in some cases, car-free streets where pedestrian and cyclist safety is the priority.',
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

        hookTitle.innerText = `The streets of NYC from a ${mode}'s perspective`;
        if (HOOK[mode]) {
            hookNumber.textContent = HOOK[mode].stat;
            hookLabel.textContent  = HOOK[mode].label;
            hookText.textContent   = HOOK[mode].text;
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

        // Wait for wiggle to finish + brief pause, then reveal and scroll
        setTimeout(() => {
            storyHook.classList.remove('hidden');
            scrollyCont.classList.remove('hidden');
            scrollPrompt.classList.remove('hidden');

            // Re-init scrollama on a fresh instance so new steps are observed cleanly
            requestAnimationFrame(() => {
                initScrollama();
                // Release block after scroll has settled
                setTimeout(() => { isSwitching = false; }, 1200);
            });
        }, 1200);
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
