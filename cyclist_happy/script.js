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
            caption: 'Figure 1: Hourly distribution of cyclist-involved collisions in New York City. The data includes all recorded cyclists involved in a vehicle collision, grouped by the hour of the day (0–23) to show the hourly trend.',
            emotion: 'thinking',
            thought: 'Rush hour... that\'s when cars stop looking out for me.',
            heading: 'The Rhythm of the Day',
            text:    'The data highlights two notable periods: a moderate increase during the morning hours around 08:00, and a more pronounced concentration in the late afternoon and early evening, peaking between 16:00 and 18:00. This pattern is closely tied to the rhythm of urban mobility. These hours correspond to the busiest periods on New York City streets, when the greatest number of cyclists and vehicles share the road. Therefore, the higher frequency of collisions during the afternoon does not necessarily indicate that cycling is inherently more dangerous at these times; rather, it reflects the increased volume of road users in circulation simultaneously.<br><br>Collision patterns may also shift across the year, and for cyclists in particular, seasonal variation in ridership could play a meaningful role.',
        },
        {
            plot:    'seasonality_cyclist_focus_plot.html',
            title:   'Seasonal Patterns in Cyclist Crashes',
            caption: 'Figure 2: Monthly distribution of collisions by road user type in New York City, expressed as a percentage of total annual crashes. Each line represents one road user group — cyclist, pedestrian, and motorist — grouped by month to illustrate seasonal variation across the year.',
            emotion: 'thinking',
            thought: 'I ride more in summer. Of course the numbers follow.',
            heading: 'The Summer Surge',
            text:    'The data shows a clear seasonal pattern: cyclist crashes reach their highest levels during the summer months and decline significantly through autumn and winter. This distribution is closely tied to ridership levels. When more cyclists are on the road, a higher collision count is a natural consequence of increased exposure. An elevated crash volume in summer does not therefore indicate that cycling is more dangerous per trip; it largely reflects the greater number of trips being made.<br><br>This distinction between volume and risk is an important one. To move beyond raw crash counts and understand where the genuine danger lies, we shift our focus from when and how many to where. Are there specific locations in New York City where cyclists are systematically more at risk, regardless of the season?',
        },
        {
            plot:    'bubble_map_cyclist.html',
            title:   'Cyclist Danger Zones — New York City',
            caption: 'Figure 3: Spatial clustering of cyclist-involved collisions in New York City. Clusters are identified using DBSCAN, a density-based algorithm that groups crashes within a 200-metre radius, requiring a minimum of 30 crashes to form a cluster. Bubble size reflects the total number of crashes in each cluster; colour reflects the fatality rate (light pink = low, dark red = high). Hovering over a bubble reveals: nearest intersection, total crash count, fatality rate, year-on-year trend, peak crash hour, most common contributing factor (the reported primary cause of the crash, e.g. driver inattention or unsafe speed), median age of those involved, and borough.',
            emotion: 'surprised',
            thought: 'Find your street. Is it on here?',
            heading: 'Where It Happens',
            text:    'The next question to be explored is where the crashes happen. Some intersections in New York City are consistently more dangerous for cyclists than others, and it is not crash volume that matters but the fatality rate that determines how dark a spot appears on the map.<br><br>The contrast can be striking. Jay Street &amp; Tillary Street in Brooklyn, one of the busiest intersections in the dataset, recorded nearly 11,000 crashes yet a fatality rate of just 0.30%. Bruckner Boulevard &amp; Rosedale Avenue in the Bronx presents a very different picture, with only 34 crashes but a fatality rate of 8.82%. This illustrates that crash volume and fatality rate do not necessarily move together. A high number of incidents at a location does not automatically indicate a high likelihood of a fatal outcome.<br><br>Hovering over the clusters reveals something familiar. Peak crash hours at the most dangerous spots tend to fall between 16:00 and 18:00, the same evening rush identified at the start of this story. Location and timing are not independent.',
        },
        {
            plot:    'rf_feature_importance_cyclist.html',
            title:   'What Factors Predict a Fatal Crash?',
            caption: 'Figure 4: Feature importance scores from a Random Forest classifier trained to predict whether a cyclist crash resulted in a fatality. Features span time (hour, day, month), place (borough), crash characteristics (vehicle type, contributing factor), and person-level details (age, sex, safety equipment, ejection status). Bar length reflects predictive strength — the longer the bar, the more the model relies on that feature.',
            emotion: 'thinking',
            thought: 'So what actually decides whether I make it home?',
            heading: 'What Makes a Crash Fatal?',
            text:    'Not all crashes are equal. Two cyclists can hit the ground at the same intersection and yet face very different odds. So what actually separates a crash from a fatality?<br><br>Ejection status tops the list. Being thrown from the bike is the clearest predictor of a fatal outcome. Age has an enormous impact too, with a cyclist over 80 being 46 times more likely to die in a crash than one under 10. Young riders between 11 and 30 are involved in the most crashes by far, but they survive at the highest rates.<br><br>Hour of day shows up as well, confirming what we saw at the start. Timing does not just affect how many crashes happen; it also affects survival.<br><br>But the third most important factor stands out as vehicle type. Not where you ride, not when you ride, but what hits you. And it turns out, not all vehicles are equally dangerous.',
        },
        {
            plot:    'rf_vehicle_type_cyclist.html',
            title:   'Fatality Rate by Vehicle Type',
            caption: 'Figure 5: Fatality rate by primary vehicle type for cyclist crashes. Top 12 vehicle types by crash volume are shown (minimum 50 crashes each), sorted from least to most deadly. Hover to see the exact fatality rate and crash count.',
            emotion: 'surprised',
            thought: 'The type of vehicle that hits me changes my odds of surviving?',
            heading: 'Does the Vehicle Matter?',
            text:    'Box trucks top the list by a wide margin with a fatality rate of 4.35%. A cyclist struck by one is far more likely to die than in any other collision. Buses and pick-up trucks follow. The pattern is hard to miss: the heavier the vehicle, the higher the fatality rate. However, these cases are also far less likely to occur.<br><br>Hover over any bar to see both the fatality rate and the number of observations. Station wagons account for the most crashes with 17,365 in total, yet the fatality rate is only 0.26%. Cyclist-on-cyclist collisions are also common, with 16,332 observations and an even lower fatality rate of 0.20%.<br><br>E-bikes land in the middle with a fatality rate of 0.80%, a reminder that the cycling landscape itself is changing.<br><br>But knowing what hits you only tells part of the story. The other part is why it happens at all.',
        },
        {
            plot:    'rf_contributing_factor_cyclist.html',
            title:   'Contributing Factors: Volume vs. Lethality',
            caption: 'Figure 6: Contributing factors for cyclist collisions, comparing total crash volume against the fatality rate per incident. This visualization distinguishes between high-frequency behavioral errors and high-lethality risks.',
            emotion: 'neutral',
            thought: 'Some of these factors... happen every single day out there.',
            heading: 'Common vs. Deadly: Two Different Problems to Solve',
            text:    'This analysis compares the frequency of each contributing factor against its fatality rate, separating what causes the most crashes from what makes them most deadly.<br><br>Alcohol Involvement has the highest fatality rate at 1.96%, followed by Unsafe Speed at 0.85%. Together they account for fewer than 1,700 cyclist crashes in total. Driver Inattention, by contrast, appears in nearly 19,500 cyclist crashes but carries a fatality rate of just 0.23%. Failure to Yield Right-of-Way follows a similar pattern, with 8,500 incidents and a fatality rate of 0.22%. High volume, low lethality.<br><br>This distinction matters for prevention. Reducing the total number of crashes requires targeting the high-frequency, everyday errors through better infrastructure and driver awareness. Eliminating fatalities requires targeting speed and impairment. Both problems are real, and both require their own response.',
        },
    ],
    pedestrian: [
        {
            plot:    'pedestrian_hourly_plot.html',
            title:   'Crashes by Hour of Day',
            caption: 'Figure 1: Hourly distribution of pedestrian-involved collisions in New York City. The data includes all recorded pedestrians involved in a vehicle collision, grouped by the hour of the day (0–23) to show the hourly trend.',
            emotion: 'thinking',
            thought: 'I walk home at 5 PM every day. I never thought about what that means statistically.',
            heading: 'The Rhythm of the Day',
            text:    'The data highlights two notable periods: a moderate increase during the morning hours around 08:00, and a more pronounced concentration in the late afternoon and early evening, peaking between 17:00 and 18:00. This pattern is closely tied to the rhythm of urban mobility. These hours correspond to the busiest periods on New York City streets, when the greatest number of pedestrians and vehicles share the same space. The higher frequency of collisions during the afternoon does not therefore indicate that the environment is inherently more dangerous at those hours; it reflects the increased volume of people in circulation simultaneously.<br><br>But timing alone does not determine who is most at risk. The same streets are shared by men and women in roughly equal numbers, yet their outcomes are not the same.',
        },
        {
            plot:    'pedestrian_fatality_by_sex_plot.html',
            title:   'Fatality Rate by Sex',
            caption: 'Figure 2: Fatality rate per 1,000 individuals involved, compared by sex. The data shows that while both genders are involved in collisions at nearly the same rate, the likelihood of a fatal outcome is higher for males.',
            emotion: 'surprised',
            thought: 'Same streets, same chance of being hit — but men die more. That stayed with me.',
            heading: 'Who Is Most at Risk?',
            text:    'When examining the demographics of pedestrian collisions in New York City, the distribution between genders is remarkably balanced, with females accounting for 50.6% and males for 49.4% of those involved. This near-equal split provides a solid baseline for comparing the fatality rates between the two groups.<br><br>While the involvement rate is almost identical, the outcome of these collisions tells a different story. Men face a fatality rate of 1.48%, compared to 0.92% for women, a gap of more than 60%. The same streets, the same traffic, but a meaningfully different chance of making it home.',
        },
        {
            plot:    'bubble_map_pedestrian.html',
            title:   'Pedestrian Danger Zones — New York City',
            caption: 'Figure 3: Spatial clustering of pedestrian-involved collisions in New York City. Clusters are identified using DBSCAN, a density-based algorithm that groups crashes within a 200-metre radius, requiring a minimum of 30 crashes to form a cluster. Bubble size reflects the total number of crashes in each cluster; colour reflects the fatality rate (light pink = low, dark red = high). Hovering over a bubble reveals: nearest intersection, total crash count, fatality rate, year-on-year trend, peak crash hour, most common contributing factor (the reported primary cause of the crash, e.g. driver inattention or unsafe speed), median age of those involved, and borough.',
            emotion: 'surprised',
            thought: 'Find your street. Is it on here?',
            heading: 'Where It Happens',
            text:    'The timing and demographics of pedestrian-involved collisions establish who is involved and when, but geography adds a third dimension. Crash volume and crash severity do not follow the same map. Bubble size reflects the number of crashes in each cluster; colour reflects the fatality rate. A large, light bubble means many collisions but a relatively low fatality rate. A smaller, darker one may represent fewer crashes but a higher chance of a fatal outcome.<br><br>The largest clusters concentrate in Brooklyn and Manhattan, reflecting the boroughs with the heaviest pedestrian traffic. Flatbush Avenue &amp; Avenue H in Brooklyn, one of the densest clusters in the dataset, recorded over 34,000 crashes with a fatality rate of 1.10%. Along Queens Boulevard, a corridor long associated with pedestrian danger, fatality rates reach 1.45% and above even at lower crash volumes. The data shows that pedestrian risk is not simply a function of how busy a street is.<br><br>Hovering over the clusters reveals a consistent pattern in time. Peak crash hours at the higher-fatality locations tend to fall in the late afternoon and evening. The where and the when point in the same direction.',
        },
        {
            plot:    'rf_feature_importance_pedestrian.html',
            title:   'Key Factors in Fatal Pedestrian Collisions',
            caption: 'Figure 4: Feature importance scores from a Random Forest classifier trained to predict whether a pedestrian crash resulted in a fatality. Features span time (hour, day, month), place (borough), crash characteristics (vehicle type, contributing factor, pedestrian location and action), and person-level details (age, sex, safety equipment, ejection status). Bar length reflects predictive strength — the longer the bar, the more the model relies on that feature.',
            emotion: 'thinking',
            thought: 'So I can\'t stop getting older, but I can definitely rethink how I cross the street.',
            heading: 'What Makes a Crash Fatal?',
            text:    'This analysis identifies the primary factors that determine whether a pedestrian collision results in a fatality. The results reveal a complex interplay between variables we can influence and those we cannot, highlighting where the greatest risks lie.<br><br>A primary predictor is Age. This is largely due to the physical vulnerability associated with older age; while our data suggests that younger individuals are involved in crashes more frequently, these incidents are statistically far more fatal for older pedestrians. Similarly, the Hour of Day remains a critical factor, reinforcing the temporal patterns we observed earlier in the city\'s daily rhythm.<br><br>However, the model also highlights factors where individual behavior and external physics play a decisive role. Pedestrian Action (what a person is doing at the moment of impact) stands out as a significant predictor that is often within one\'s own control. Conversely, Vehicle Type reminds us that the sheer size and nature of the vehicle involved heavily dictates the chance of survival.<br><br>To better understand these dynamics, we will dive deeper into how our own actions and the vehicles we share the road with shape the outcome of a crash.',
        },
        {
            plot:    'rf_vehicle_type_pedestrian.html',
            title:   'Fatality Rate by Vehicle Type',
            caption: 'Figure 5: Fatality rate by primary vehicle type for pedestrian crashes. Top 12 vehicle types by crash volume are shown (minimum 50 crashes each), sorted from least to most deadly. Hover to see the exact fatality rate and crash count.',
            emotion: 'surprised',
            thought: 'A box truck doesn\'t give you a chance.',
            heading: 'Does the Vehicle Matter?',
            text:    'The data highlights a stark physical reality. Pedestrians are entirely unprotected, and what hits them determines their odds of survival. Sedans are involved in over 52,000 pedestrian crashes, by far the most common vehicle in the dataset, yet carry a fatality rate of just 0.83%. Box trucks are involved in only 715 pedestrian crashes, but with a fatality rate of 5.45%, a pedestrian struck by one is more than six times as likely to die. SUVs and station wagons sit in between, with nearly 40,000 crashes and a fatality rate of 1.36%, already nearly double that of a sedan. The sheer mass and height of larger vehicles mean that when a collision occurs, the outcome is far more likely to be fatal.',
        },
        {
            plot:    'rf_ped_action.html',
            title:   'Fatality Rate by Pedestrian Action',
            caption: 'Figure 6: Fatality rate by pedestrian action at time of crash. Crossing with the signal, jaywalking, or standing still — each carries a different survival rate.',
            emotion: 'thinking',
            thought: 'I jaywalk all the time. I hadn\'t thought about what that costs.',
            heading: 'What Is Behind the Pedestrian\'s Action?',
            text:    'What a pedestrian is doing at the moment of impact has a measurable effect on survival. Crossing with the signal is the safest recorded action, appearing in 37,238 incidents with a fatality rate of 0.55%. Crossing against the signal more than triples that rate to 2.16% across 6,309 crashes. Walking along a highway against traffic carries a fatality rate of 4.33%, nearly eight times higher than crossing with the signal, though with only 231 recorded incidents it is far less common.<br><br>These patterns sit at the intersection of individual behavior and infrastructure design. Some non-compliant actions occur frequently in specific locations, which raises the question of whether the behavior reflects poor choice or a street that is poorly adapted to how people actually move. A crossing point that requires a long detour will reliably produce jaywalking regardless of what the signal says.<br><br>This is precisely the kind of distinction targeted by Vision Zero, a New York City government initiative launched in 2014 to eliminate all traffic deaths and serious injuries through data-driven engineering, enforcement, and education. Some actions are inherently dangerous; others become dangerous because the infrastructure does not match how people actually move through the city.',
        },
        {
            plot:    'rf_contributing_factor_pedestrian.html',
            title:   'Contributing Factors: Volume vs. Lethality',
            caption: 'Figure 7: Contributing factors for pedestrian collisions, comparing total crash volume against the fatality rate per incident. This visualization distinguishes between high-frequency behavioral errors and high-lethality risks.',
            emotion: 'neutral',
            thought: 'Speeding is rare. But when it happens, it kills.',
            heading: 'Common vs. Deadly: Two Different Problems to Solve',
            text:    'This analysis examines the contributing factors behind collisions, specifically comparing their frequency against their severity. As identified in our predictive model, the specific behavior of the driver is one of the most critical indicators of whether a crash will result in a fatality.<br><br>The data tells two very different stories. Alcohol Involvement carries the highest fatality rate at 4.88%, but it appears in only 758 pedestrian crashes in the dataset. Unsafe Speed follows at 3.37% across 1,749 incidents. These are the most lethal contributing factors, but they are comparatively rare. Driver Inattention, by contrast, is involved in 28,036 pedestrian crashes, with a fatality rate of just 0.84%. Failure to Yield Right-of-Way follows a similar pattern, with 26,342 incidents and a fatality rate of 0.82%. High volume, lower lethality, but because they happen so frequently, they still account for a massive share of the city\'s total pedestrian casualties.<br><br>This distinction is vital for safety prevention. To reach the goal of zero fatalities, enforcement and design must target high-lethality behaviors like speeding. At the same time, to reduce the total number of accidents across the city, we must address the frequent, everyday errors like inattention through better intersection design and public awareness.',
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
            text:    'The data highlights two notable periods: a concentration during the morning commute around 08:00, and a more pronounced peak in the late afternoon and early evening, between 17:00 and 18:00. This pattern closely follows the rhythm of urban traffic. These hours correspond to the busiest periods on New York City roads, when the greatest number of vehicles are in circulation. The higher frequency of collisions during these windows does not therefore indicate that driving is inherently more dangerous at those hours; it reflects the sheer volume of vehicles sharing the road simultaneously.<br><br>But timing is only one dimension. Behind each collision lies a combination of factors, and understanding the true shape of motorist risk means looking beyond the clock.',
        },
        {
            plot:    'risk_vs_reality_motorist_plot.html',
            title:   'Risk vs. Reality',
            caption: 'Figure 2: Daily collision share (solid line) versus traffic volume share (dashed line), both expressed as a percentage of the daily total, by hour of day (0–23). The shaded area marks hours where crash share exceeds traffic volume share. Traffic volume is based on sampled counts and serves as an approximation of general flow patterns.',
            emotion: 'surprised',
            thought: 'The afternoon always feels more tense. Turns out it\'s not just me.',
            heading: 'More Traffic, More Crashes — But Not in Equal Measure',
            text:    'The collision distribution across the day closely mirrors the underlying traffic volume, with both rising during the morning commute and peaking in the late afternoon. This alignment suggests that the number of crashes at any given hour is, to a significant degree, a function of how many vehicles are on the road. In that sense, the afternoon peak is not inherently more dangerous: it is simply busier.<br><br>However, the visualization reveals something more nuanced. During the afternoon hours, the shaded area marking "Disproportionate Danger" indicates that the share of daily collisions exceeds the share of traffic volume at those same hours. In other words, while the afternoon sees more traffic, which partly explains the higher crash count, the collision rate climbs even faster than the traffic does. This suggests that heavy traffic conditions may themselves be a contributing factor. Congestion, time pressure, frequent lane changes, and driver frustration can all elevate the likelihood of a collision beyond what volume alone would predict.<br><br>The takeaway is not simply that more cars mean more crashes. It is that the relationship between traffic density and collision risk is not linear, and that the afternoon hours carry a disproportionate share of the total daily crash burden.',
        },
        {
            plot:    'weather_effect_motorist_plot.html',
            title:   'Weather Effect on Daily Crashes',
            caption: 'Figure 3: Average number of daily motorist-involved collisions on clear/normal days compared to winter storm days, identified by road salt usage in New York City. Salt usage data is used as a proxy for days with snow or ice on the roads, sourced from New York City Department of Sanitation records.',
            emotion: 'scared',
            thought: 'Snow days always felt tense behind the wheel. Turns out that feeling was right.',
            heading: 'When the Weather Turns',
            text:    'Beyond the time of day and traffic volume, weather is another underlying factor worth examining, as it can have a direct influence on driving conditions and collision risk.<br><br>The data used here does not contain direct weather measurements. Instead, days with road salt usage, recorded by the New York City Department of Sanitation, serve as a proxy for days with snow or ice on the roads. This means that milder forms of bad weather, such as rain or fog, are not captured by this measure. That said, the signal from the data is clear. On days when salt is used, the average number of daily motorist collisions rises from 302 to 380, an increase of roughly 26%. Even given the limitation of the proxy, the pattern is consistent and worth taking seriously.',
        },
        {
            plot:    'bubble_map_motorist.html',
            title:   'Motorist Danger Zones — New York City',
            caption: 'Figure 4: Spatial clustering of motorist-involved collisions in New York City. Clusters are identified using DBSCAN, a density-based algorithm that groups crashes within a 75-metre radius, requiring a minimum of 30 crashes to form a cluster. Bubble size reflects the total number of crashes in each cluster; colour reflects the fatality rate (light pink = low, dark red = high). Hovering over a bubble reveals: nearest intersection, total crash count, fatality rate, year-on-year trend, peak crash hour, most common contributing factor (the reported primary cause of the crash, e.g. driver inattention or unsafe speed), median age of those involved, and borough.',
            emotion: 'surprised',
            thought: 'Find your street. Is it on here?',
            heading: 'Where It Happens',
            text:    'Collision frequency and collision severity do not follow the same geography. Bubble size reflects total crash volume; colour reflects the fatality rate. The two do not move together, and that distinction is the point.<br><br>Brooklyn and Manhattan concentrate the highest number of motorist collisions, reflected in the larger bubbles across those boroughs. Yet many of those clusters carry relatively low fatality rates. Staten Island presents a different picture. Collision volumes are lower, but several clusters there carry some of the highest fatality rates in the dataset. High traffic does not automatically mean high danger, and low traffic does not mean safety.<br><br>Hovering over individual clusters shows that peak crash hours at many of the higher-fatality locations align with the evening rush identified at the start of this story. The where and the when are not independent.<br><br>The map tells us where the risk concentrates, but not why some crashes turn fatal and others do not.',
        },
        {
            plot:    'rf_feature_importance_motorist.html',
            title:   'What Factors Predict a Fatal Crash?',
            caption: 'Figure 5: Feature importance scores from a Random Forest classifier trained to predict whether a motorist crash resulted in a fatality. Features span time (hour, day, month), place (borough), crash characteristics (vehicle type, contributing factor), and person-level details (age, sex, safety equipment, ejection status). Bar length reflects predictive strength — the longer the bar, the more the model relies on that feature.',
            emotion: 'thinking',
            thought: 'Staying inside the car, strapped in — that\'s what keeps you alive.',
            heading: 'What Makes a Crash Fatal?',
            text:    'This analysis identifies the primary factors that determine whether a motorist collision results in a fatality. The results reveal a combination of variables we can control and those that depend on the physics of the crash itself.<br><br>The leading predictor is Ejection Status, meaning whether the driver or passenger is thrown from the vehicle during the collision. Being ejected from a car dramatically reduces the protection offered by the vehicle\'s structure and is among the most dangerous outcomes of any crash. Third on the list is Safety Equipment, which in this context largely reflects seatbelt use. The data confirms what road safety campaigns have long argued. Wearing a seatbelt is one of the most decisive factors in surviving a crash. Together, these two variables tell a consistent story. Staying inside the vehicle and remaining restrained significantly improves your odds.<br><br>Contributing Factor and Sex also appear as meaningful predictors, suggesting that the specific circumstances of a crash and behavioral patterns play a role in determining severity, though their individual contribution is smaller than the physical factors above.<br><br>And yet, right between ejection and seatbelt use in the ranking, sits Vehicle Type. Not where you drive, not when you drive, but what you drive. It turns out that not all vehicles carry the same level of risk.',
        },
        {
            plot:    'rf_vehicle_type_motorist.html',
            title:   'Fatality Rate by Vehicle Type',
            caption: 'Figure 6: Fatality rate by primary vehicle type for motorist crashes. Top 12 vehicle types by crash volume are shown (minimum 50 crashes each), sorted from least to most deadly. Hover to see the exact fatality rate and crash count.',
            emotion: 'surprised',
            thought: 'My car is my shield.',
            heading: 'Does Your Vehicle Matter?',
            text:    'This chart illustrates the fatality rate for motorists based on the primary vehicle they were driving at the time of the collision. You can hover over each bar to see the specific fatality rate and the total number of individuals involved in each category.<br><br>The most striking result is the dominance of Motorcycles at the top of the chart. With a fatality rate of 1.09%, motorcycles stand far apart from every other vehicle type. The reason is straightforward. Motorcyclists have no protective shell around them. In that sense, a motorcyclist is closer in vulnerability to a pedestrian or cyclist than to a car driver. The vehicle body is precisely what keeps most motorists safe in a collision, and removing it changes the risk entirely.<br><br>This becomes even clearer when comparing across road user types. For pedestrians, the fatality rate when struck by a Box Truck reaches 5.45%. For a motorist inside a vehicle involved in the same type of collision, that figure drops to just 0.01%. The car body absorbs the impact in a way the human body simply cannot.<br><br>Even the highest motorist fatality rate, motorcycles at 1.09%, remains well below the rates faced by unprotected road users. The data makes one thing clear. The greatest protective factor for a motorist is the vehicle itself.',
        },
        {
            plot:    'rf_contributing_factor_motorist.html',
            title:   'Contributing Factors: Volume vs. Lethality',
            caption: 'Figure 7: Contributing factors for motorist collisions, comparing total crash volume against the fatality rate per incident. This visualization distinguishes between high-frequency behavioral errors and high-lethality risks.',
            emotion: 'neutral',
            thought: 'I check my phone at red lights. I probably shouldn\'t.',
            heading: 'Common vs. Deadly: Two Different Problems to Solve',
            text:    'This analysis examines the contributing factors behind motorist collisions, specifically comparing their frequency against their severity. As identified in our predictive model, driver behavior is one of the most critical indicators of whether a crash will result in a fatality.<br><br>The data tells two very different stories. Unsafe Speed and Traffic Control Disregarded have a relatively low crash volume, but they are the most lethal factors in the dataset. When speeding is involved, the fatality rate for motorists reaches 0.32%, the highest of any contributing factor in this group. That figure may seem small, but it is striking in context. For pedestrians struck by a speeding vehicle, the equivalent fatality rate is 3.37%, more than ten times higher. The same behavior behind the wheel carries vastly different consequences depending on who bears the impact. Conversely, Driver Inattention and Distraction is by far the most common factor, yet its individual fatality rate is much lower. Because it occurs so frequently, however, it still accounts for a massive share of the city\'s total collisions.<br><br>This distinction points toward a clear policy conclusion. To reduce total crash volume, the most effective interventions target everyday behavioral errors like inattention through better intersection design, clearer signage, and public awareness. But to reduce fatalities, the focus must shift to the high-lethality behaviors such as speeding and disregarding traffic controls. These are precisely the behaviors that infrastructure can address directly through speed bumps, reduced speed limits, redesigned junctions, and in some cases car-free streets where pedestrian and cyclist safety is the priority.',
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

        hookTitle.innerText = `The streets of New York City from a ${mode}'s perspective`;
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
