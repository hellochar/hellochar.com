
export class NovationLaunchControl {
    constructor(
        public handleButtonPress: (event: ButtonPressEvent) => void,
        public handleKnobTwist: (event: KnobTwistEvent) => void,
    ) {}

    async start() {
        const access = await (navigator as any).requestMIDIAccess();
        // console.log(access);

        const inputs = access.inputs;
        const outputs = access.outputs;

        for (const input of inputs.values()) {
            input.onmidimessage = this.handleMidiMessage;
        }
    }

    private handleMidiMessage = (midiMessage: any /*WebMidi.MIDIMessageEvent*/) => {
        const COMMAND_KNOB = 184;
        const COMMAND_NOTEON = 152;
        const COMMAND_NOTEOFF = 136;
        const [commandType, noteValue, velocity] = midiMessage.data;

        // console.log(midiMessage.data);

        const button = BUTTON_MAPPING[noteValue];
        if (button && commandType === COMMAND_NOTEON || commandType === COMMAND_NOTEOFF) {
            this.handleButtonPress({
                button,
                pressed: velocity > 0,
            });
            return;
        }

        const knob = KNOB_MAPPING[noteValue];
        if (knob && commandType === COMMAND_KNOB) {
            this.handleKnobTwist({
                knob,
                value: velocity / 127,
            });
        }
    }
}

export interface ButtonPressEvent {
    button: Button;
    pressed: boolean;
}

export interface KnobTwistEvent {
    knob: Knob;
     value: number;
}

const BUTTON_MAPPING: { [noteValue: number]: Button } = {
    9: 1,
    10: 2,
    11: 3,
    12: 4,
    25: 5,
    26: 6,
    27: 7,
    28: 8,
};

const KNOB_MAPPING: { [noteValue: number]: Knob } = {
    21: 1,
    22: 2,
    23: 3,
    24: 4,
    25: 5,
    26: 6,
    27: 7,
    28: 8,
    41: 9,
    42: 10,
    43: 11,
    44: 12,
    45: 13,
    46: 14,
    47: 15,
    48: 16,
};

export type Button = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
export type Knob = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16;
