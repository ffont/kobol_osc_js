class RectifierProcessor extends AudioWorkletProcessor {

    static get parameterDescriptors() {
        return [
          {
            name: "threshold",
            defaultValue: 0.5,
            minValue: 0.0,
            maxValue: 1.0,
          },
        ];
      }
  
    process(inputs, outputs, parameters) {
      
      const input = inputs[0];
      const output = outputs[0];
      const threshold = parameters.threshold;

      for (let channel = 0; channel < output.length; ++channel) {
        const inputChannel = input[channel];
        const outputChannel = output[channel];

        for (let i = 0; i < outputChannel.length; ++i) {
          if (inputChannel[i] <= threshold){
            outputChannel[i] = inputChannel[i];  
          } else {
            outputChannel[i] = threshold - inputChannel[i];
          }
          outputChannel[i] = outputChannel[i] + (1 - threshold)/2
        } 
      }
      return true;
    }
  }
  
  registerProcessor('rectifier', RectifierProcessor);