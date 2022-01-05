import { AtpApplicationSettings } from 'dotsdk';
import { RecoEngineRandomizer } from './reco-engine-randomizer';
fdescribe('Reco Engine Randomizer', () => {
  describe('getRandomFromRangeInclusive()', () => {
    it('should generate random normal within 15% tolerance limit', () => {
      const occurencesCount = 999;
      let optionOneOccurences = 0;
      let optionTwoOccurences = 0;
      let optionThreeOccurences = 0;
      for (let i = 0; i < occurencesCount; i++) {
        const pickedRandom = RecoEngineRandomizer[
          'getRandomFromRangeInclusive'
        ]([1, 3]);
        switch (pickedRandom) {
          case 1:
            optionOneOccurences++;
            break;
          case 2:
            optionTwoOccurences++;
            break;
          case 3:
            optionThreeOccurences++;
            break;
        }
      }

      const normalMedianOccurences = occurencesCount / 3;
      const normalToleranceLimitPercent = 15;
      const normalToleranceLimit = Math.ceil(
        (normalToleranceLimitPercent / 100) * normalMedianOccurences
      );

      expect(optionOneOccurences).toBeLessThan(
        normalMedianOccurences + normalToleranceLimit
      );
      expect(optionOneOccurences).toBeGreaterThan(
        normalMedianOccurences - normalToleranceLimit
      );

      expect(optionTwoOccurences).toBeLessThan(
        normalMedianOccurences + normalToleranceLimit
      );
      expect(optionTwoOccurences).toBeGreaterThan(
        normalMedianOccurences - normalToleranceLimit
      );

      expect(optionThreeOccurences).toBeLessThan(
        normalMedianOccurences + normalToleranceLimit
      );
      expect(optionThreeOccurences).toBeGreaterThan(
        normalMedianOccurences - normalToleranceLimit
      );
    });

    it('should return a number witch touches the range\'s lower end when the Math.random generates a 0', () => {
      const MathRandomSpy = spyOn(Math, 'random');
      MathRandomSpy.and.returnValue(0);
      const min = 25;
      const max = 88;
      const result = RecoEngineRandomizer['getRandomFromRangeInclusive']([
        min,
        max,
      ]);
      expect(result).toBe(min);
    });

    it('should return a number witch touches the range\'s higher end when the Math.random generates a 0.9999999', () => {
      const MathRandomSpy = spyOn(Math, 'random');
      MathRandomSpy.and.returnValue(0.999999999);
      const min = 25;
      const max = 88;
      const result = RecoEngineRandomizer['getRandomFromRangeInclusive']([
        min,
        max,
      ]);
      expect(result).toBe(max);
    });

    it('should return a number witch touches the range\'s middle point when the Math.random generates a 0.50000', () => {
      const MathRandomSpy = spyOn(Math, 'random');
      MathRandomSpy.and.returnValue(0.5);
      const min = 126;
      const max = 182;
      const result = RecoEngineRandomizer['getRandomFromRangeInclusive']([
        min,
        max,
      ]);
      const expected = (max - min) / 2 + min;
      expect(result).toBe(expected);
    });
    it('should return a number where (number == min == max) when (min == max)', () => {
      const MathRandomSpy = spyOn(Math, 'random');
      MathRandomSpy.and.returnValue(0.5);
      const min = 125;
      const max = min;
      const result = RecoEngineRandomizer['getRandomFromRangeInclusive']([
        min,
        max,
      ]);
      expect(result).toBe(min);
      expect(result).toBe(max);
    });
  });

  describe('recommendationEnabledModes() getter', () => {
    beforeEach(() => {
      AtpApplicationSettings.getInstance()['_bundleSettingsJson'] = {};
    });
    it('should return ["KIOSK_BUILDER"] as default if no recommendationEnabledModes BS defined', () => {
      AtpApplicationSettings.getInstance()['_bundleSettingsJson'] = {
        recommendationEnabledModes: undefined,
      };
      const result = RecoEngineRandomizer['recommendationEnabledModes'];
      expect(result.length).toBe(1);
      expect(result[0]).toBe('KIOSK_BUILDER');
    });
    it('should return ["KIOSK_BUILDER"] as default if recommendationEnabledModes BS defined but not of type array', () => {
      AtpApplicationSettings.getInstance()['_bundleSettingsJson'] = {
        recommendationEnabledModes: 'someoptions',
      };
      const result = RecoEngineRandomizer['recommendationEnabledModes'];
      expect(result.length).toBe(1);
      expect(result[0]).toBe('KIOSK_BUILDER');
    });
    it('should return ["KIOSK_BUILDER"] as default if recommendationEnabledModes BS defined and valid but no option selected', () => {
      AtpApplicationSettings.getInstance()['_bundleSettingsJson'] = {
        recommendationEnabledModes: [],
      };
      const result = RecoEngineRandomizer['recommendationEnabledModes'];
      expect(result.length).toBe(1);
      expect(result[0]).toBe('KIOSK_BUILDER');
    });
    it('should return selected recommendationEnabledModes defined in BS', () => {
      const _recommendationEnabledModes = ['option1', 'option2'];
      AtpApplicationSettings.getInstance()['_bundleSettingsJson'] = {
        recommendationEnabledModes: _recommendationEnabledModes,
      };
      const result = RecoEngineRandomizer['recommendationEnabledModes'];
      expect(result.length).toBe(_recommendationEnabledModes.length);
      expect(result[0]).toBe(_recommendationEnabledModes[0]);
      expect(result[1]).toBe(_recommendationEnabledModes[1]);
      expect(result[3]).not.toBeDefined();
    });
  });

  describe('pickRandom()', () => {
    it('should return a random option from recommendationEnabledModes BS', () => {
      const _recommendationEnabledModes = [
        'option1',
        'option2',
        'option3',
        'option4',
      ];
      AtpApplicationSettings.getInstance()['_bundleSettingsJson'] = {
        recommendationEnabledModes: _recommendationEnabledModes,
      };
      const MathRandomSpy = spyOn(Math, 'random');

      MathRandomSpy.and.returnValue(0);
      expect(RecoEngineRandomizer.pickRandom()).toBe(
        _recommendationEnabledModes[0]
      );

      MathRandomSpy.and.returnValue(0.49);
      expect(RecoEngineRandomizer.pickRandom()).toBe(
        _recommendationEnabledModes[1]
      );

      MathRandomSpy.and.returnValue(0.51);
      expect(RecoEngineRandomizer.pickRandom()).toBe(
        _recommendationEnabledModes[2]
      );

      MathRandomSpy.and.returnValue(0.999);
      expect(RecoEngineRandomizer.pickRandom()).toBe(
        _recommendationEnabledModes[3]
      );
    });
  });
});
