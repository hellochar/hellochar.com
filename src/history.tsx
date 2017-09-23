import * as React from "react";

export const HistorySection = () => (
    <section className="content-section history" id="history">
        <h1>Big List of Stuff</h1>
        <History2017 />
        <History2016 />
        <History2015 />
        <History2014 />
        <HistoryOlder />
        </section>
);

const Title: React.StatelessComponent<{href?: string}> = ({href, children}) => {
    const titleElement = href == null
        ? children
        : <a href={href}>{children}</a>;

    return (
        <h2 className="history-item-title">{titleElement}</h2>
    )
};

export const History: React.StatelessComponent<{ name: string }> = ({name, children}) => (
    <section className="history-year">
        <h2>{name}</h2>
        <section>
            {children}
        </section>
    </section>
);

const History2017 = () => (
    <History name="2017">
        <p>
            <Title href="https://hellochar.github.io/phone-theremin">Phone Theremin</Title>.
            Turn your phone into a musical instrument. Visit the website on mobile and simply rotate your phone to change the pitch and volume.
            Made at the <a href="http://topos.house/">Topos House</a> <a href="http://hypotext.co/antidisciplinarathon">Antidisciplinarathon</a>. 
            Live music performance often has a revered, inaccessible feeling that separates the performer
            from the audience - the performer is looked at in awe and admiration, but at a distance. By allowing practically every
            audience member to be a musical source we dissolve the difference between performer and audience. Instead,
            everyone is simply performing for everyone else. The actual sound is a total cacophany of missed pitches, which is kind of the point -
            we're imperfect beings, looking for connection with one another.
        </p>
        <p>
            <Title href="https://hellochar.github.io/songinanhour">Song in an hour</Title>.
            To help my friends and I get over the hurdles of composing music. We put ourselves on a one
            hour timer to compose, write lyrics, and record a song of some sort in 60 minutes. The accompanying
            website helps provide inspiration and initial ideas by suggesting chord progressions, emotions,
            melodies, and lyric synonyms. We post our "finished" songs on <a href="https://soundcloud.com/user-961025728-756560287">Soundcloud</a>.
            Warning: most of them are, well, pretty bad, as you might expect. Be gentle :smile:.
        </p>
        <p>
            <Title href="https://soundcloud.com/xiaohan-zhang/sets/one-song-a-day">One song a day</Title>.
            A personal challenge to create a new musical composition every day. A personal test of perseverance,
            commitment, effective practice, and finishing things.
        </p>
        <p className="history-item-small">
            <Title href="https://github.com/hellochar/Shadow-of-the-Honey-Badger">GGJ2017 - Shadow of the Honey Badger.</Title>
            [video]
            [image]
            [image]
        </p>
        <p className="history-item-small">
            <Title href="https://github.com/hellochar/7drl-2017">7drl2017.</Title>
            [video]
            [image]
            [image]
            [image]
        </p>
    </History>
);

const History2016 = () => (
    <History name="2016">
        <p>
            <Title>3D Web Fest 2016.</Title> Performed web-vj. <a href="https://www.youtube.com/watch?v=Z8WhaCPIrzs">
            Watch a video of the performance.
            </a>
        </p>
        <p>
            <Title href="https://github.com/hellochar/ggj2016">ggj2016</Title>.
            A roguelike video game that uses web technologies and free web assets as much as possible.
            [video]
            [image]
            [image]
        </p>
    </History>
);

const History2015 = () => (
    <History name="2015">
        <p>
            <Title href="https://globalgamejam.org/2015/games/adventures-bot-y">
                GGJ2015 - Adventures of Boty.
            </Title> Simple platformer game.
        </p>
        <p>
            <Title href="https://www.facebook.com/events/306662996124584/">Sentience</Title>.
            Organizer, curator, and artist for Sentience 2015, an immersive multi-media art exhibit and 3d audio/video
            experience. Sentience was a one night event at Public Works SF
            that featured custom visuals, musicians, and (my responsibility) an interactive multimedia art gallery. I found, organized,
            and supported digital artists in the space. I designed and implemented a Max/MSP Patch that computes bark coefficients of the 
            current audio being played in the venue and broadcasts that through the local wifi network - digital artists could then retrieve
            the coefficients and use it to drive parameters in the digital art pieces.
            <iframe className="video" src="https://player.vimeo.com/video/150231439" width="640" height="360" frameBorder="0" allowFullScreen></iframe>
        </p>
        <p>
        False mirror with tunable parameters. [video] [image] [image] [image of normal sketch]
        Description of what it was.
        </p>
        <p>
        <Title>(performing art)</Title>. Real time interactive art installation.
        Collaboration with Katherine Frazer. An XBOX Kinect maps body gestures into
        Cuts and Pastes on an ever evolving canvas that takes webcam input from the
        the room. Explores how humans percieve and then fabricate digital versions
        of the world, which are then placed into the world itself.
        Shown at the <a href="http://codame.com/events/art-tech-festival-2015">Codame Art+Tech Festival 2015</a>.
        <div className="row">
            <div className="row-item">
                <img className="row-image" src="https://lh3.googleusercontent.com/K_uTz-i8g-eiqRzpYJa8y6mz1eVnOMJSXHnUnVhoJOA9a51G1QVFfAMbsrOuJwBOLc-kMBjjHjeu76Qp2mppDqWUNG-4VUw4-vZMmr1f_opsAX4ysivo0cFmlGKM1oL3Dlt8RdcPbmrVVhA1duFUiuv9o3HrgPjcCk90QD0VQ4_eMhgsrSeqKwNaSFYB1s8H2LihSUbWTl1vNXeNt_KjceoPEeg4Prldq0PxvpDDFG4Yb-BPNBhVIGJA2HpqTSeM9SeDWfMVP8RhR9vclHRzfz2RSHVUSRd1TdA3PUm1xqPE7iLZvVG9eEknPwV2sbJU5egGSl5ugJuMDQNTx-NOzJEbmvA3jeUfB_r6ULDrLVPjiVXU2wdIW-gHFXz1nzYaX3c0VkoqLqA3Jmml6xPje6hgm4rLvJx11EUC53TqkE2HhirTZvuAtL4gk-YMOG6nrNYLvwzcUf5Sk9ENPKNrq9Uqt0yhTbly7ZpIolxsS1qGu3vRHAZAblY_mspsODDyBDMBYXfPzozw87Np-Yuv0r7MAivrM3SAnxyR0SsHfrcLSHbeSzhSs26V3bbU3faGVYuYb-SWBbfeVul2QPD5BCrlqRuiYgwO4jq4KMPkTA=w1525-h858-no" />
            </div>
            <div className="row-item">
                <img className="row-image" src="https://lh3.googleusercontent.com/SK_JI6q5SWDjiXM298sh6rDyZxXtKH-247wr9hdHeXC119d-_oEaaxyUnECgVeVkiFjuP8EFEg1-W98WWbO17wAnOC2yvgEsE1PD4g3tZCz0CZOb2QKKpm85HUGd1wdF6HlUOjvSYcjExbG6xzSzNIyehwiOm1CcqYYMUlcYE-pjd3g6KQP6f1jSQ-wIUiPLljdvXkbTICkuTaDCtyefyov0SruTwBeDykyjmml090TRbSoUijA0q5fJFGAOoTj0504WvGi7vM82V5wkzBatsXpsrajyv-h0UhWxB0hZ_TQPtawA3DFX8rO5fdt72CXl7ywICFAHYM0lVGFJ_Rd5ROrPfnMHzi02pMcfsuMW5uhyf6ZlOaRkDvWEQL_y9Jmpi3MmE33CTCHoK-8RiqNs6PNiMEIB5Cc-Ev0foRJAyZHTE1I4bn3C3tvaAZ9g0QTtHxRBo0Kwmb-TlWSiaEuG2p5fLjaMsk_wpwnFO9h_lX8K74VfETvjToFb7TuzW5mFeZG_UychCDlAPlc-FJ5-OlTCrU418LCC-W8WPj6cGOf3AhqsF6H0PUlk_axwqn3EWyVsfjwa3YT1RNZautTLProRKqQa0VvclYppwE5rXw=w1525-h858-no" />
            </div>
            <div className="row-item">
                <img className="row-image" src="https://lh3.googleusercontent.com/BMl7yeyuWTxSG9xA6qIYDpx4qhmkYX1iUyrm89jVuJDz3EwMcQIh6smL0yUb5R8SxXifgf1OD-Za2YIrQWmZHj6lPhdxzVrf07yxTAA45__bl8N1qXG_k-xXPuPgPxp4J2DoZH5pyzymUniv_wXTHUnkbl47aXaZ7vhKYPBYeL9sm36sS5tkZ9sy9i_b_jm2gwXXkk-z_zlTSoUxIyShilHjZshbU7uEZvli7OC3HH9nKjfif3pHfFCVLm-dY88DmRNiF760hI3ctnTJVkXPXlzn7UXwaHlMCr47mPaGRbmkg7DxbscNjgoPei7H35Ftnc1C19XselFMkgUSdnqrkacU96vLvrl_4Hjs4tayjg5GX0oQF5ZncOO7TWmQAU_q2bj__kVJcok3B9YJewkXXx1HFmgJJpy3nPQnNJR501beO8fj6IX8k_zeFwV-222K7GjTo775-JjneaX1v_7LoT7erUabpImAV2va8eb7rNYhkJgz_gsOjiIjQ4klYKtiRyf0xCLEqhswMXqHFO4nOkQ9KWo6x91EpXECp380Z67ce8-F27zQqRHSp1o8nYbK5_OrCiBojamvbPBD-ywXpp9gKXIoWzu6ywAaW09xIA=w483-h858-no" />
            </div>
            <div className="row-item">
                <img className="row-image" src="https://lh3.googleusercontent.com/wfYike9dpb5GV6SQzSrGXwDzqPHSgAyS7zyPU1ZU12STWvVN3YXpF9H4MLlKki2YxhNdzi4E5XYd2HNiQuyC10hLU3kObFgY_8GPBScmYECinTaGBSeSocKBoM_q4v39ieeEWdzBUZetGIBUmO3Z1p9tThUNJWYQZ8h-OI5w1q3z2VlAxfE0KKqNSn3ALUwRi5VoNn_cNHanGT4isiumHpPQVlDPoyc2G3sHa_xhby8sJ3sdPv59GmbC1Hkjlia04m2YjRx3plXUs4jMQLZNp9CRu2W5qCA3oN80W4MJfsjuP8CJ-9GvFBNQ7SJFbl2ohai1h6mEX86wwFXL6cdDAuFaPjciVx7RbPJujg_SExjZ1hC1tfzfeEeyF9ChHLAu1qM5CqKQQk3bsC1kD4kiBg2X6JaZgOtiytoAIw1NVvmeL4Uwy-MOvciCNRPD8GHuMrnhf76RZ7530noQ-e7BFc4ayAWq2_gpds4LvNH4g9yfCuXSv9W6z4kfwcU5RgdEA7DxMQn3V689uMXg0UcNMel8blaNkJEx55Op1iQp2UmZQ2cJhKuOPZSE6Log_BW0fR83X8lp3wgqk3-XO1IuWtY6NoQwMBPOjc2H_Tzqlw=w1525-h858-no" />
            </div>
        </div>
        [video] [video]
        </p>
        <p>
        <Title href="http://grayarea.org/education/immersive/">Gray Area Immersive TA - Spring 2015</Title>.
        Ten week program teaching students from mostly non-technical backgrounds a variety
        of programming and creative code concepts. As a TA I was responsible for supporting the
        class through an array of teachers and topics such as web skills, Processing,
        Javascript, Arduino, and projection mapping.
        <img className="full-width" src="https://lh3.googleusercontent.com/Q7doAntds2iA0yz-j40KqqYDdtoh2P_Mr0MzBFIDbuDdBJxD4hSmq8a2CG_cAb-8Gltnufv38Rz8vd51r_WT-p1CobtgWw03oMDqJoXyHAhFIt8c4K6Q5UAmpHw3ImpL-BKqZHGnaO6dVA_QqXtDDFsQVg_n8HZZzD4t8AQIkqaAaJeIeAVwi8NqmRGX5I8_TUKvdNytkxTRti7BtvBXpZZApZi9Gt-YMuHEGx6rfAgr1AFotzJAU6Sqhs2S0bC0p_6sUcURZ-JQoCT_zizThwin2yAUlFzhWp5GrS60G_N7dN6DyV7fjZodKXtPnRnDleIG5DTVq8oNd5Z0zbHo2afx8xg-sI4bUCabPj7ly0TlR8CSu97mO8Jo7L78KJZjAqc8Mkv1npO6M-y6FnVH7pV0iOYB6d1wmP459FdiKL6hYu9uDFqWgPvTxA19RsH8py90wVDQ273C-UD37fYV9L5As--sL1mLZ60A1rBxhfmSFfcGpVcBw8Wy8nCZH5t5YO5LZmSpvpfh1xtjtbRm-fHiwN6tVmqvoImmllQUtspsbRMOSEdbbdexkgLT81lZ9ar0_DTpSLvCdBjsxHMWel3wmB77EM1Pn0-0JDEEOw=w1632-h918-no" />
        </p>
        <p>
        Gray Area Immersive work - virtual horses (Natural Habitat).
        Natural Habitat explores the made up worlds we imagine for ourselves. A projected
        screen shows a 3D scene of horses running around a perpetually sunny field, idling
        their days by. The screen is placed adjacent to a physical manifestation of the space
        - fake grass, a fence, some hay. A body sensor detects users when they enter the
        space and alerts the horses of their presence. As users stare into a made up world,
        the horses stare back at you and wonder the same thing. 
        [video] [image] [image] [image]
        </p>
        <p>
            web-vj.
            real-time vj tool running on the web. Reads MIDI data from the Novation Launch Control MIDI Controller
            and adjusts parameters of a real time 3D scene. Performed at the CCRMA Transitions 2015 concert.
            [link] [video] [image] [image]
        </p>
        <p>
            projected network (video feedback).
            Experiments with video feedback - pointing a webcam at a wall upon which is being
            projected the webcam input.
            [image] [image] [image] [video] [github] [link]
        </p>
    </History>
);

const History2014 = () => (
    <History name="2014">
        <p>
            GGJ2014 - CYMK.
        </p>
        <p>
            Maker Faire 2014
        </p>
        <p>
            Multimedia Orchestra @Berkeley. Organized events, provided community space and learning opportunities.
            Held public media concerts. [link] [link] [video] [media] [image]
        </p>
        <p>
            EEG piece. Read input data from the emotive EEG in collaboration with a guitarist performing live
            [link] [link] [video]
        </p>
        <p>
        flappybird ai
        </p>
        <p>
        [link to party-quest.com] party-quest. 
        Inspired by Twitch Plays Pokemon, Party-Quest is a real time
        multiplayer video game in which multiple players control the
        movements of a single character exploring a dungeon full of
        spikes, trapdoors, and exploding pigs. Designed to be a party
        game projected onto a large screen, anyone can visit www.party-quest.com
        to get a set of controls on their phone or computer. The game was designed
        to 1) be immediately understandable, 2) be playable with any number of
        players, 3) create a sense of group engagement. The controls are extremely
        simple - tapping up, down, left, and right moves the character, applying a
        force impulse. Multiple users tapping together will apply a larger force and
        thus move faster - if they can agree on where to go. Together, users have to
        avoid spikes, dodge moving enemies, step over floor buttons to activate doors,
        use wooden crates as shields, and navigate under icy conditions. It was shown
        at Multimedia Orchestra's Spring Show 2014 and Maker Faire 2014.
        [video] [image] [image] [image]
        </p>
        <p>
        growth
        [gif1] [gif2]
        Real-time VJ software connected to the Novation Launch Control.
        </p>
    </History>
);

const HistoryOlder = () => (
    <History name="Older">
        <p>
            <video autoPlay loop>
                <source src="/assets/waterandair.mp4" />
            </video>
            Water and air.
        </p>
    </History>
);
