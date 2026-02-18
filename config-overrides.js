
module.exports = function override(config, env) {
  console.log('Overriding webpack config...');
  
  // Iterate over all rules to find source-map-loader
  config.module.rules.forEach(rule => {
    // Check if the rule has a 'oneOf' property (standard for CRA)
    if (rule.oneOf) {
      rule.oneOf.forEach(oneOfRule => {
        if (oneOfRule.loader && oneOfRule.loader.includes('source-map-loader')) {
           if (!oneOfRule.exclude) {
             oneOfRule.exclude = [];
           }
           if (!Array.isArray(oneOfRule.exclude)) {
             oneOfRule.exclude = [oneOfRule.exclude];
           }
           oneOfRule.exclude.push(/node_modules\/@mediapipe\/tasks-vision/);
        }
      });
    }
    
    // Also check for top-level rules (sometimes source-map-loader is a pre-loader)
    if (rule.enforce === 'pre' && rule.loader && rule.loader.includes('source-map-loader')) {
       if (!rule.exclude) {
         rule.exclude = [];
       }
       if (!Array.isArray(rule.exclude)) {
         rule.exclude = [rule.exclude];
       }
       // Add the exclusion for the problematic package
       rule.exclude.push(/node_modules\/@mediapipe\/tasks-vision/);
    }
  });

  return config;
};
