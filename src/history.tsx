import * as React from "react";

export const HistorySection = () => (
    <section className="content-section history" id="history">
        <h1>Big List of Stuff (Work History)</h1>
        <History2017 />
        <History2016 />
        <HistoryG year="2015" items={9} />
        <HistoryG year="2014" items={8} />
        <HistoryG year="2013" items={4} />
        <HistoryG year="older" items={60} />
        </section>
);

const History2017 = () => (
    <section className="history-year">
        <h2>2017</h2>
        <section>
            <p>
                <a href="https://hellochar.github.io/phone-theremin">Phone Theremin</a>.
                Turn your phone into a musical instrument.
                Made at the Topos House [link] antidisciplinarathon [link]. 
            </p>
            <p>
                <a href="https://hellochar.github.io/songinanhour">Song in an hour</a>.
                To help my friends and I get over the hurdles of composing music.
                Soundcloud [link].
            </p>
            <p>
                <a href="https://soundcloud.com/xiaohan-zhang/sets/one-song-a-day">One song a day</a>.
                A new song or musical composition of some sort every day. A personal test of perseverance,
                commitment, effective practice, and finishing things.
            </p>
            <p>
                GGJ2017 - Shadow of the Honey Badger.
                [video]
                [image]
                [image]
            </p>
            <p>
                7drl2017.
                [video]
                [image]
                [image]
                [image]
            </p>
        </section>
    </section>
);

const History2016 = () => (
    <section className="history-year">
        <h2>2016</h2>
        <section>
            Took a big long break from creative code.
            <p>
                <a href="https://github.com/hellochar/ggj2016">ggj2016</a>.
                A roguelike video game that uses web technologies and free web assets as much as possible.
                [video]
                [image]
                [image]
            </p>
        </section>
    </section>
);


const HistoryG = ({year, items}: {year: any, items: number}) => {
    const itemFigures: JSX.Element[] = [];
    for (let i = 0; i < items; i++) {
        const figure = (
            <section>
                <img src="https://unsplash.it/400/300?random" />
                <figcaption>This cool thing happened in 2017. It was pretty cool.
                    Maybe I would write a few more lines about it. It might
                    even get this long! Or even, this long? No way. What
                    if there was a <a href="#">Link in here?</a>. Wow.
                </figcaption>
            </section>
        );
        itemFigures.push(figure);
    }
    return (
        <section className="history-year">
            <h2>{year}</h2>
            { itemFigures }
        </section>
    );
};