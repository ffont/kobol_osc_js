class ComparatorProcessor extends AudioWorkletProcessor {

    static get parameterDescriptors() {
        return [
          {
            name: "threshold",
            defaultValue: 1.0,
            minValue: 0.0,
            maxValue: 1.0,
          },
        ];
      }
  
    process(inputs, outputs, parameters) {
      
      const input = inputs[0];
      const output = outputs[0];
      const threshold = parameters.threshold * (0.9-0.5) + 0.5;  // threshold input goes from 0 to 1, but we want 0.5 to 0.9

      for (let channel = 0; channel < output.length; ++channel) {
        const inputChannel = input[channel];
        const outputChannel = output[channel];

        for (let i = 0; i < outputChannel.length; ++i) {
          if (inputChannel[i] <= threshold){
            outputChannel[i] = -1.0;  
          } else {
            outputChannel[i] = 1.0;
          }
        } 
      }
      return true;
    }
  }
  
  registerProcessor('comparator', ComparatorProcessor);