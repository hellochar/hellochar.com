import * as classnames from "classnames";
import * as React from "react";
import LazyLoad from "react-lazyload";

import { Images } from "../common/images";

export const HistorySection = () => (
    <section className="content-section history" id="history">
        <h1>Big List of Stuff</h1>
        <LazyLoad once>
            <History2017 />
        </LazyLoad>
        <LazyLoad once>
            <History2016 />
        </LazyLoad>
        <LazyLoad once>
            <History2015 />
        </LazyLoad>
        <LazyLoad once>
            <History2014 />
        </LazyLoad>
    </section>
);

const Title: React.StatelessComponent<{href?: string}> = ({href, children}) => {
    const titleElement = href == null
        ? children
        : <a href={href}>{children}</a>;

    return (
        <span className="history-item-title">{titleElement}</span>
    );
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
            <Title>Drawing with Gravitational Waves</Title>. Drawing With Gravitational Waves was a performance and improvisational
            science/music/art experience in Wallenberg Theatre at Stanford on November 17th, 2017, in collaboartion with painter and artist
            Pamela Davis Kivelson and classical improv violinist Lucy Liuxuan Zhang. I wrote phyics simulations in Processing inspired by gravitational
            waves and adopted a pure black/white visual style (the right half of the screen) to contrast with Pam's paintings on the left.
            We further processed Pam's paintings with different Processing sketches to intermix traditional art with digital work.
            <iframe className="figure-video" src="https://player.vimeo.com/video/243603441" height="393" frameBorder="0" allowFullScreen></iframe>
        </p>
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
            <Title href="https://github.com/hellochar/7drl-2017">7drl2017.</Title> Experimental game. The main game mechanic is algebraic tree structure manipulation.
            Tree literals are called "crystals" and contain a Number (positive or negative) and a Flavor (red/green/blue). Flavors "beat"
            each other in a rock paper scissors fashion. In addition to literals, there are operators that can take one nodes and modify them,
            e.g. the modulator changes the color of the crystal into what the original color was strong against.
            You would play as a wizard that had a weapon, a shield, and an HP bar for each Flavor. Combat was a turn based approach where wizards could
            either attack, or swap nodes around.
        </p>
    </History>
);

const History2016 = () => (
    <History name="2016">
        <p>
            <Title>Glowcon 2016</Title>. Modified Gravity to take input from the Leap Motion sensor. Users could attract particles with their pointer finger.
            I spent some time finding just the right interaction here. Originally the finger z position controlled the intensity of the pull (starting with no pull)
            but I found users confused and unable to have direct control. Since the average person has no experience interacting with a Leap Motion controller I
            made the interaction dead simple - just attract to wherever the index finger is. Additionally I added the whole hand skeleton to help make that connection
            between physical and digital space.
            <iframe className="figure-video" height="393" src="https://www.youtube.com/embed/ovFrFWpg2ro?rel=0&amp;showinfo=0&amp;start=75" frameBorder="0" allowFullScreen></iframe>
            <Images>
                <img src="/assets/images/history/gravity_leapmotion1.png" />
                <img src="/assets/images/history/gravity_leapmotion2.png" />
                <img src="/assets/images/history/gravity_leapmotion3.png" />
            </Images>
        </p>
        <p>
            <Title>20mission's going fourth party.</Title> Put web-vj out there for any party goers to experiment and play with.
            <Images>
                <img src="https://scontent-sjc2-1.xx.fbcdn.net/v/t31.0-8/12976944_782102208966_8471501848337640168_o.jpg?oh=55df77b59446a79fb21860936a091a3e&oe=5A6DA062" />
                <img src="https://scontent-sjc2-1.xx.fbcdn.net/v/t31.0-8/12967967_782102149086_7897997315764132786_o.jpg?oh=0cf4cb046ca5672fcad5c99a904314a9&oe=5AACB804" />
                <img src="https://scontent-sjc2-1.xx.fbcdn.net/v/t31.0-8/12916973_782100392606_7699892061294714129_o.jpg?oh=ebba32ac613b17f9dd8160792cf130b1&oe=5A66DD7D" />
                <img src="https://scontent-sjc2-1.xx.fbcdn.net/v/t31.0-8/12916257_782100751886_4221315897959822193_o.jpg?oh=ad3f65215a930465fed35dfeeb5e5171&oe=5A78C88C" />
                <img src="https://scontent-sjc2-1.xx.fbcdn.net/v/t31.0-8/12719515_10153513276983733_2917334965798317860_o.jpg?oh=4b336376113869bc29afae4954acf775&oe=5AA3B41F" />
                <img src="https://scontent-sjc2-1.xx.fbcdn.net/v/t31.0-8/12719168_10153513277278733_409027285730465035_o.jpg?oh=90eb3d1932a6421f0767369d01509aa3&oe=5A75D617" />
                <img src="https://scontent-sjc2-1.xx.fbcdn.net/v/t31.0-8/12909609_10153513188588733_1763786166874271113_o.jpg?oh=5ed0372dcdb087c47a607441f377d137&oe=5A6873BD" />
            </Images>
        </p>
        <p className="history-item-small">
            <Title href="https://www.youtube.com/watch?v=Z8WhaCPIrzs">3D Web Fest 2016.</Title> Performed web-vj.
            <iframe className="figure-video" height="393" src="https://www.youtube.com/embed/Z8WhaCPIrzs?rel=0&amp;showinfo=0&amp;start=555" frameBorder="0" allowFullScreen></iframe>
        </p>
        <p>
            <Title href="https://github.com/hellochar/ggj2016">ggj2016</Title>.
            An unfinished roguelike video game that used web technologies and free web assets as much as possible. <a
            href="https://5-71942994-gh.circle-artifacts.com/0/home/ubuntu/ggj2016/build/index.html">
            Play a test build here.</a> It featured:
            <ul>
                <li>12 different level generation algorithms based on Conway's Game of Life- CA simulations.</li>
                <li>Basic inventory, weapon, hunger, warmth, and energy system.</li>
                <li>Modernized UI that took full advantage of web capabilities e.g. popovers when mousing over items to see their description, CSS animations, etc.</li>
                <li>React/Redux state model for easy time travel debugging.</li>
            </ul>
            <Images>
                <img src="/assets/images/history/ggj2016/0.png" />
                <img src="http://i.imgur.com/0nRkwvn.png" />
                <img src="/assets/images/history/ggj2016/1.png" />
                <img src="/assets/images/history/ggj2016/2.png" />
                <img src="/assets/images/history/ggj2016/3.png" />
            </Images>
        </p>
    </History>
);

const History2015 = () => (
    <History name="2015">
        <p className="history-item-small">
            <Title href="https://globalgamejam.org/2015/games/adventures-bot-y">
                GGJ2015 - Adventures of Boty.
            </Title> Simple platformer game.
        </p>
        <p>
            <Title href="https://www.facebook.com/events/306662996124584/">Sentience</Title>.
            Organizer, curator, and artist for Sentience 2015, an immersive multi-media art exhibit and 3d audio/video
            experience. Sentience was a one night event at Public Works SF
            that featured custom visuals, musicians, and (my responsibility) an interactive multimedia art gallery. I found, organized,
            and supported digital artists in the space. <a href="https://www.facebook.com/miorel/media_set?set=a.10107535453402791.1073742061.2051980&type=3">
            See photos of the show. </a>
            <iframe className="figure-video" height="395" src="https://player.vimeo.com/video/150231439" frameBorder="0" allowFullScreen></iframe>
            <Images>
                <img src="/assets/images/history/sentience/5.jpg" />
                <img src="/assets/images/history/sentience/6.jpg" />
                <img src="/assets/images/history/sentience/4.jpg" />
                <img src="/assets/images/history/sentience/7.jpg" />
                <img src="/assets/images/history/sentience/9.jpg" />
                <img src="/assets/images/history/sentience/crew.jpg" />
            </Images>
            The crew. Love you guys.
        </p>
        <p>
            <Title>OSC Bark Coefficient Emitter.</Title> Designed and implemented a Max/MSP Patch that
            computes the <a href="https://en.wikipedia.org/wiki/Bark_scale">bark coefficients</a> of an
            audio track, such as the live music being played during the Sentience show, and broadcasts <a href="https://en.wikipedia.org/wiki/Open_Sound_Control">
            OSC messages</a> through UDP on the local wifi network. Digital artists could then retrieve the coefficients and use it to drive parameters in their art
            pieces, allowing all the art in a venue to react in tandem to the music.
        </p>
        <p>
        <Title>False mirror with tunable parameters</Title>.
        Personal project for the Sentience show. A 40 inch TV is laid flat upon a six foot tall wooden sturcture and connected
        to a laptop running real time visuals inside. The wooden box has physical sliders and knobs placed on it
        to allow event-goers to interact with the visuals. The visuals listen to OSC bark coefficients.
        <iframe className="figure-video" height="400" src="https://www.youtube.com/embed/pc4n7tdlpv8?rel=0&amp;showinfo=0" frameBorder="0" allowFullScreen></iframe>
        <Images className="full-size">
            <img src="/assets/images/history/falsemirror/1.jpg" />
            <img src="/assets/images/history/falsemirror/2.jpg" />
            <img src="/assets/images/history/falsemirror/3.jpg" />
        </Images>
        </p>
        <p>
        <Title>(performing art)</Title>. Real time interactive art installation.
        Collaboration with Katherine Frazer. An XBOX Kinect maps body gestures into
        Cuts and Pastes on an ever evolving canvas that takes webcam input from the
        the room. Explores how humans percieve and then fabricate digital versions
        of the world, which are then placed into the world itself.
        Shown at the <a href="http://codame.com/events/art-tech-festival-2015">Codame Art+Tech Festival 2015</a>.
        <iframe className="figure-video" src="https://www.facebook.com/plugins/video.php?href=https%3A%2F%2Fwww.facebook.com%2FCODAME.ART.TECH%2Fvideos%2F1084699231606404%2F&show_text=0&width=700" height="393" scrolling="no" frameBorder="0" allowTransparency allowFullScreen></iframe>
        <Images>
            <img src="https://lh3.googleusercontent.com/K_uTz-i8g-eiqRzpYJa8y6mz1eVnOMJSXHnUnVhoJOA9a51G1QVFfAMbsrOuJwBOLc-kMBjjHjeu76Qp2mppDqWUNG-4VUw4-vZMmr1f_opsAX4ysivo0cFmlGKM1oL3Dlt8RdcPbmrVVhA1duFUiuv9o3HrgPjcCk90QD0VQ4_eMhgsrSeqKwNaSFYB1s8H2LihSUbWTl1vNXeNt_KjceoPEeg4Prldq0PxvpDDFG4Yb-BPNBhVIGJA2HpqTSeM9SeDWfMVP8RhR9vclHRzfz2RSHVUSRd1TdA3PUm1xqPE7iLZvVG9eEknPwV2sbJU5egGSl5ugJuMDQNTx-NOzJEbmvA3jeUfB_r6ULDrLVPjiVXU2wdIW-gHFXz1nzYaX3c0VkoqLqA3Jmml6xPje6hgm4rLvJx11EUC53TqkE2HhirTZvuAtL4gk-YMOG6nrNYLvwzcUf5Sk9ENPKNrq9Uqt0yhTbly7ZpIolxsS1qGu3vRHAZAblY_mspsODDyBDMBYXfPzozw87Np-Yuv0r7MAivrM3SAnxyR0SsHfrcLSHbeSzhSs26V3bbU3faGVYuYb-SWBbfeVul2QPD5BCrlqRuiYgwO4jq4KMPkTA=w1525-h858-no" />
            <img src="https://lh3.googleusercontent.com/SK_JI6q5SWDjiXM298sh6rDyZxXtKH-247wr9hdHeXC119d-_oEaaxyUnECgVeVkiFjuP8EFEg1-W98WWbO17wAnOC2yvgEsE1PD4g3tZCz0CZOb2QKKpm85HUGd1wdF6HlUOjvSYcjExbG6xzSzNIyehwiOm1CcqYYMUlcYE-pjd3g6KQP6f1jSQ-wIUiPLljdvXkbTICkuTaDCtyefyov0SruTwBeDykyjmml090TRbSoUijA0q5fJFGAOoTj0504WvGi7vM82V5wkzBatsXpsrajyv-h0UhWxB0hZ_TQPtawA3DFX8rO5fdt72CXl7ywICFAHYM0lVGFJ_Rd5ROrPfnMHzi02pMcfsuMW5uhyf6ZlOaRkDvWEQL_y9Jmpi3MmE33CTCHoK-8RiqNs6PNiMEIB5Cc-Ev0foRJAyZHTE1I4bn3C3tvaAZ9g0QTtHxRBo0Kwmb-TlWSiaEuG2p5fLjaMsk_wpwnFO9h_lX8K74VfETvjToFb7TuzW5mFeZG_UychCDlAPlc-FJ5-OlTCrU418LCC-W8WPj6cGOf3AhqsF6H0PUlk_axwqn3EWyVsfjwa3YT1RNZautTLProRKqQa0VvclYppwE5rXw=w1525-h858-no" />
            <img src="https://lh3.googleusercontent.com/BMl7yeyuWTxSG9xA6qIYDpx4qhmkYX1iUyrm89jVuJDz3EwMcQIh6smL0yUb5R8SxXifgf1OD-Za2YIrQWmZHj6lPhdxzVrf07yxTAA45__bl8N1qXG_k-xXPuPgPxp4J2DoZH5pyzymUniv_wXTHUnkbl47aXaZ7vhKYPBYeL9sm36sS5tkZ9sy9i_b_jm2gwXXkk-z_zlTSoUxIyShilHjZshbU7uEZvli7OC3HH9nKjfif3pHfFCVLm-dY88DmRNiF760hI3ctnTJVkXPXlzn7UXwaHlMCr47mPaGRbmkg7DxbscNjgoPei7H35Ftnc1C19XselFMkgUSdnqrkacU96vLvrl_4Hjs4tayjg5GX0oQF5ZncOO7TWmQAU_q2bj__kVJcok3B9YJewkXXx1HFmgJJpy3nPQnNJR501beO8fj6IX8k_zeFwV-222K7GjTo775-JjneaX1v_7LoT7erUabpImAV2va8eb7rNYhkJgz_gsOjiIjQ4klYKtiRyf0xCLEqhswMXqHFO4nOkQ9KWo6x91EpXECp380Z67ce8-F27zQqRHSp1o8nYbK5_OrCiBojamvbPBD-ywXpp9gKXIoWzu6ywAaW09xIA=w483-h858-no" />
            <img src="https://lh3.googleusercontent.com/wfYike9dpb5GV6SQzSrGXwDzqPHSgAyS7zyPU1ZU12STWvVN3YXpF9H4MLlKki2YxhNdzi4E5XYd2HNiQuyC10hLU3kObFgY_8GPBScmYECinTaGBSeSocKBoM_q4v39ieeEWdzBUZetGIBUmO3Z1p9tThUNJWYQZ8h-OI5w1q3z2VlAxfE0KKqNSn3ALUwRi5VoNn_cNHanGT4isiumHpPQVlDPoyc2G3sHa_xhby8sJ3sdPv59GmbC1Hkjlia04m2YjRx3plXUs4jMQLZNp9CRu2W5qCA3oN80W4MJfsjuP8CJ-9GvFBNQ7SJFbl2ohai1h6mEX86wwFXL6cdDAuFaPjciVx7RbPJujg_SExjZ1hC1tfzfeEeyF9ChHLAu1qM5CqKQQk3bsC1kD4kiBg2X6JaZgOtiytoAIw1NVvmeL4Uwy-MOvciCNRPD8GHuMrnhf76RZ7530noQ-e7BFc4ayAWq2_gpds4LvNH4g9yfCuXSv9W6z4kfwcU5RgdEA7DxMQn3V689uMXg0UcNMel8blaNkJEx55Op1iQp2UmZQ2cJhKuOPZSE6Log_BW0fR83X8lp3wgqk3-XO1IuWtY6NoQwMBPOjc2H_Tzqlw=w1525-h858-no" />
        </Images>
        </p>
        <p>
            <Title>Gray Area Summer 2015 Immersive Instructor</Title>.
            Taught the first week of Gray Area's Immersive program (basics of programming and Processing).
        </p>
        <p>
        <Title href="http://grayarea.org/education/immersive/">Gray Area Spring 2015 Immersive TA</Title>.
        Ten week program teaching students from mostly non-technical backgrounds a variety
        of programming and creative code concepts. As a TA I was responsible for supporting the
        class through an array of teachers and topics such as web skills, Processing,
        Javascript, Arduino, and projection mapping.
        <Images>
            {[
                <img key={0} src="https://lh3.googleusercontent.com/Q7doAntds2iA0yz-j40KqqYDdtoh2P_Mr0MzBFIDbuDdBJxD4hSmq8a2CG_cAb-8Gltnufv38Rz8vd51r_WT-p1CobtgWw03oMDqJoXyHAhFIt8c4K6Q5UAmpHw3ImpL-BKqZHGnaO6dVA_QqXtDDFsQVg_n8HZZzD4t8AQIkqaAaJeIeAVwi8NqmRGX5I8_TUKvdNytkxTRti7BtvBXpZZApZi9Gt-YMuHEGx6rfAgr1AFotzJAU6Sqhs2S0bC0p_6sUcURZ-JQoCT_zizThwin2yAUlFzhWp5GrS60G_N7dN6DyV7fjZodKXtPnRnDleIG5DTVq8oNd5Z0zbHo2afx8xg-sI4bUCabPj7ly0TlR8CSu97mO8Jo7L78KJZjAqc8Mkv1npO6M-y6FnVH7pV0iOYB6d1wmP459FdiKL6hYu9uDFqWgPvTxA19RsH8py90wVDQ273C-UD37fYV9L5As--sL1mLZ60A1rBxhfmSFfcGpVcBw8Wy8nCZH5t5YO5LZmSpvpfh1xtjtbRm-fHiwN6tVmqvoImmllQUtspsbRMOSEdbbdexkgLT81lZ9ar0_DTpSLvCdBjsxHMWel3wmB77EM1Pn0-0JDEEOw=w1632-h918-no" />,
            ]}
        </Images>
        </p>
        <p>
            <Title>Natural Habitat.</Title> Natural Habitat explores the made up worlds we
            imagine for ourselves. A projected screen shows a 3D scene of horses running around
            a perpetually sunny field, idling their days by. The screen is placed adjacent to a
            physical manifestation of the space - fake grass, a fence, some hay. A body sensor
            detects users when they enter the space and alerts the horses of their presence. As
            users stare into a made up world, the horses stare back at you and wonder the same thing.
            <Images>
                {[<img key={0} src="/assets/images/history/natural_habitat.png" />]}
            </Images>
        </p>
        <p>
            <Title href="https://github.com/hellochar/web-vj">web-vj</Title>.
            real-time vj tool running on the web. Reads MIDI data from the Novation Launch Control MIDI Controller
            and adjusts parameters of a real time 3D scene. Performed at the CCRMA Transitions 2015 concert.
            <iframe className="figure-video" height="393" src="https://www.youtube.com/embed/VhYl6zShcfI?start=4620&amp;rel=0&amp;showinfo=0" frameBorder="0" allowFullScreen></iframe>
        </p>
        <p>
            <Title href="https://github.com/data-doge/projected-network">projected network (live video feedback).</Title>
            Experiments with live webcam video feedback - pointing a webcam at a wall upon which is being
            projected the webcam input.
            <iframe className="figure-video" height="393" src="https://www.youtube.com/embed/iqqaE0KZQkI?rel=0&amp;showinfo=0" frameBorder="0" allowFullScreen></iframe>
            <iframe className="figure-video" height="393" src="https://www.youtube.com/embed/jXETVVLYl-g?rel=0&amp;showinfo=0" frameBorder="0" allowFullScreen></iframe>
            <Images>
                <img src="https://lh3.googleusercontent.com/5-QuChH6QPD0bEELncRi1W-jwZnY6VI-fygOHC1i1R9XAiU2KUIU41CRZmrEvSsZlBbtmCCu0MuqmECYZjNSqR4amKkTDSpaHssn9OM4XxE6Vrzbo0-QB8cNzWi1zHvSAMJZutaLJoYurFCi-VF_1135mPw8K3KlYAjhiyGo44kBOy_oFI6VjrHKyhLowN4yW0qGJksYl7t-5R_V1IJGZYJIPvo07rDnp0VtXjUd_Cyh_axrP6gEY8FZs0Wohfb0dQSiR4zDTiMZrSTjOTgXjPsrD4Hw921Ar065FGqCNS20pS8hsj0U1p77pU9L7xZW0SOUzpHd6XFp9lu7MSBEyIEsvumRrJE_McxWfZ318RuIL4YqsRg_B8ezy0UiRfFfbfe8bwiMNamNoQ8VWNQz9QXvsGb3jiOtUVy_mEmQpPfWqofW3lyu9Rk1BkLrzC26Lp-EROrICxrchI28xZWrOIxMS86pJlCTexKzhb9IafDASwejJ2LlRD1o8_mu0CMJt2aeakfmPJmLQGECbye3utrLPm2tJsRMoFho3DdjqjliyuVf6mEOY2aK-TWKpd4ObocBh1ZsS7HkkdFTCWJqs7XJNbzPRNUxoO8rZDWwjQ=w482-h855-no" />
                <img src="/assets/images/history/projected-network/pulse/00227.png" />
                <img src="/assets/images/history/projected-network/pulse/00542.png" />
                <img src="/assets/images/history/projected-network/pulse/00569.png" />
                <img src="/assets/images/history/projected-network/pulse/01818.png" />
                <img src="/assets/images/history/projected-network/pulse/01849.png" />
                <img src="/assets/images/history/projected-network/pulse/02381.png" />
                <img src="/assets/images/history/projected-network/pulse/02550.png" />
                <img src="/assets/images/history/projected-network/pulse/03596.png" />
                <img src="/assets/images/history/projected-network/pulse/05413.png" />
                <img src="/assets/images/history/projected-network/pulse/05736.png" />
                <img src="/assets/images/history/projected-network/pulse/05751.png" />
                <img src="/assets/images/history/projected-network/pulse/07515.png" />
                <img src="/assets/images/history/projected-network/pulse/07584.png" />
                <img src="/assets/images/history/projected-network/pulse/07647.png" />
                <img src="/assets/images/history/projected-network/pulse/08117.png" />
            </Images>
        </p>
        <p>
            <Title>Fractal Chamber (live video feedback).</Title> projector/webcam feedback, fed through openCV to
            do blob detection which is then overlaid on the original image at an positional offset (and also changes
            hues over time).
            <iframe className="figure-video" height="393" src="https://www.youtube.com/embed/Rf7t-KRBbkk?rel=0&amp;showinfo=0" frameBorder="0" allowFullScreen></iframe>
            <iframe className="figure-video" height="393" src="https://www.youtube.com/embed/w76KgXv5HHI?rel=0&amp;showinfo=0" frameBorder="0" allowFullScreen></iframe>
            <Images className="full-size">
                <img src="/assets/images/history/projected-network/frame00081.png" />
                <img src="/assets/images/history/projected-network/frame00271.png" />
                <img src="/assets/images/history/projected-network/frame00319.png" />
                <img src="/assets/images/history/projected-network/frame00430.png" />
                <img src="/assets/images/history/projected-network/frame00487.png" />
                <img src="/assets/images/history/projected-network/frame00558.png" />
            </Images>
        </p>
        <p>
            <Title>3D Web Fest 2015.</Title> Performed Gravity.
            <iframe className="figure-video" height="393" src="https://www.youtube.com/embed/D-FILGRGqXw?rel=0&amp;showinfo=0&amp;start=314" frameBorder="0" allowFullScreen></iframe>
            <Images>
                <img src="/assets/images/history/3dwebfest2015/2.jpg" />
                <img src="/assets/images/history/3dwebfest2015/3.jpg" />
                <img src="/assets/images/history/3dwebfest2015/4.jpg" />
                <img src="/assets/images/history/3dwebfest2015/5.jpg" />
                <img src="/assets/images/history/3dwebfest2015/6.jpg" />
                <img src="/assets/images/history/3dwebfest2015/7.jpg" />
                <img src="/assets/images/history/3dwebfest2015/8.jpg" />
                <img src="/assets/images/history/3dwebfest2015/11.jpg" />
                <img src="/assets/images/history/3dwebfest2015/13.jpg" />
                <img src="/assets/images/history/3dwebfest2015/15.jpg" />
                <img src="/assets/images/history/3dwebfest2015/16.jpg" />
            </Images>
            </p>
    </History>
);

const History2014 = () => (
    <History name="2014">
        <p>
            <Title href="https://globalgamejam.org/2014/games/cmyk">GGJ2014 - CYMK.</Title> Multiplayer
            real-time cooperative online puzzle game. Centered around the notion of
            different perceptions to the same problem, each player can only interact with objects
            that are similarly colored.
            <Images>
                {[<img key={0} src="https://globalgamejam.org/sites/default/files/styles/game_sidebar__wide/public/game/featured_image/cmyk_screenshot.png?itok=URolMaCD&timestamp=1390780093" />]}
            </Images>
        </p>
        <p>
            <Title>Multimedia Orchestra @Berkeley</Title>. Multimedia Orchestra @Berkeley was a student organization
            dedicated to giving students opportunities to learn and share interactive art, creative code, instrument making,
            Max/MSP, etc. We organized student shows of art installations, live visuals influenced by musicians' EEG signals,
            traditional art/painting, group singalongs, etc, along with a trip to Maker Faire 2014.
            <Images>
                <img src="/assets/images/history/multimediaorchestra/3.jpg" />
                <img src="/assets/images/history/multimediaorchestra/1.jpg" />
                <img src="/assets/images/history/multimediaorchestra/5.jpg" />
                <img src="/assets/images/history/multimediaorchestra/6.jpg" />
                <img src="/assets/images/history/multimediaorchestra/7.jpg" />
                <img src="/assets/images/history/multimediaorchestra/2.jpg" />
                <img src="/assets/images/history/multimediaorchestra/4.jpg" />
            </Images>
        </p>
        <p>
            <Title>EEG piece</Title>. Read input data from the emotive EEG on a guitarist performing live and use
            it to feed a 3D superformula piece. Made for the Multimedia Orchestra Spring 2014 show.
            <Images>
                {[<img key={0} src="/assets/images/history/multimediaorchestra/eeg.png" />]}
            </Images>
        </p>
        <p>
            <Title href="https://github.com/hellochar/flappybird-ai">flappybird-ai</Title>. Simple "AI" program that plays flappy bird for you.
            It constantly takes screenshots of flappy bird running on an emulator on your computer, does extremely primitive object detection to
            build a model of the game, and then uses that model of the game to decide whether to "tap" the emulator screen or not.
            <Images>
                <img src="https://raw.githubusercontent.com/hellochar/flappybird-ai/master/gameplay.gif" />
                <img src="https://raw.githubusercontent.com/hellochar/flappybird-ai/master/highscore.png" />
            </Images>
        </p>
        <p>
            <Title>vectorfield</Title>. Kinect body motions hook into a modified fluid dynamics simulation. Users could "push" energy around to each other,
            create swirls, and affect each other's energy.
            <Images>
                <img src="/assets/images/history/vectorfield3.png" />
                <img src="/assets/images/history/vectorfield4.png" />
                <img src="/assets/images/history/vectorfield6.png" />
            </Images>
        </p>
        <p>
            <Title>gravity 2013</Title>. Reworking gravity to do up to 500k particles using Scala's parallel collections. Additionally, use the Leap Motion controller
            to control both a attractor and a repeller.
            <Images>
                <img src="/assets/images/history/gravity2.png" />
                <img src="/assets/images/history/gravity6.png" />
                <img src="/assets/images/history/gravity7.png" />
                <img src="/assets/images/history/gravity8.png" />
                <img src="/assets/images/history/gravity9.png" />
            </Images>
        </p>
        <p>
        <Title>party-quest.</Title> Inspired by Twitch Plays Pokemon, Party-Quest is a real time
        multiplayer video game in which multiple players control the
        movements of a single character exploring a dungeon full of
        spikes, trapdoors, and exploding pigs. Designed to be a party
        game projected onto a large screen, anyone can visit www.party-quest.com
        to get a set of controls on their phone or computer. The game was designed
        to:
        <ol>
            <li>
                Be intuitively understandable - there are no on screen instructions,
                since users can come and go as they please in the gallery.
            </li>
            <li>
                Be playable with any number of players. The game should be finishable
                with one player, but feel different with many players.
            </li>
            <li>Create a sense of group engagement. Players should feel that their actions
                affect the group in a significant way.
            </li>
        </ol>
        The controls are extremely simple - tapping up, down, left, and right moves the
        character, applying a force impulse. Multiple users tapping together will apply
        a larger force and thus move faster - if they can agree on where to go. Together,
        users have to avoid spikes, dodge moving enemies, step over floor buttons to activate doors,
        use wooden crates as shields, and navigate under icy conditions. Shown
        at Multimedia Orchestra's Spring 2014 show and Maker Faire 2014.
        </p>
        <p>
        <Title href="https://github.com/hellochar/growth">growth.</Title> Real-time VJ
        software connected to live performance on the Novation Launch Control.
        <Images>
            <img src="https://raw.githubusercontent.com/hellochar/growth/master/example1.gif" />
            <img src="https://raw.githubusercontent.com/hellochar/growth/master/example2.gif" />
        </Images>
        </p>
        <p>
            <Title href="http://p5wscala.wordpress.com">p5wscala</Title>. My college blog dedicated to my creative coding using Processing
            with the Scala programming language.
        </p>
    </History>
);
