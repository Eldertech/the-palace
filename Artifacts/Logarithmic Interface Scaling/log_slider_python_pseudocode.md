# Logarithmic Slider - Python & Pseudocode

## Python Implementation

```python
import math

class LogSlider:
    """A slider that uses logarithmic scaling for values spanning multiple orders of magnitude"""
    
    def __init__(self, min_value, max_value):
        """
        Initialize the logarithmic slider
        
        Args:
            min_value: Minimum value the slider can represent (e.g., 0.1)
            max_value: Maximum value the slider can represent (e.g., 10)
        """
        self.min_value = min_value
        self.max_value = max_value
        # Pre-calculate log values for efficiency
        self.log_min = math.log10(min_value)
        self.log_max = math.log10(max_value)
    
    def position_to_value(self, position):
        """
        Convert slider position (0-100) to actual value using log scale
        
        Args:
            position: Slider position from 0 to 100
            
        Returns:
            The actual value at this position
            
        Example:
            position=0   → returns min_value (e.g., 0.1)
            position=50  → returns sqrt(min * max) (e.g., 1.0)
            position=100 → returns max_value (e.g., 10)
        """
        # Normalize position to 0-1 range
        t = position / 100.0
        
        # Interpolate in log space
        log_value = self.log_min + t * (self.log_max - self.log_min)
        
        # Convert back from log space to actual value
        actual_value = 10 ** log_value
        
        return actual_value
    
    def value_to_position(self, value):
        """
        Convert actual value to slider position (0-100) using log scale
        
        Args:
            value: The actual value to convert
            
        Returns:
            The slider position (0-100) for this value
            
        Example:
            value=0.1 → returns 0
            value=1.0 → returns 50
            value=10  → returns 100
        """
        # Convert value to log space
        log_value = math.log10(value)
        
        # Find where this sits between log_min and log_max
        t = (log_value - self.log_min) / (self.log_max - self.log_min)
        
        # Scale to 0-100 range
        position = t * 100.0
        
        return position


# Usage Example
if __name__ == "__main__":
    # Create a slider that goes from 0.1 to 10
    slider = LogSlider(min_value=0.1, max_value=10)
    
    # Test: What value is at the center?
    center_value = slider.position_to_value(50)
    print(f"Position 50 (center) = {center_value:.4f}")  # Should be 1.0
    
    # Test: Where is the value 2.0 on the slider?
    position_of_2 = slider.value_to_position(2.0)
    print(f"Value 2.0 is at position {position_of_2:.2f}")  # Should be ~65
    
    # Test: Show some values across the slider
    print("\nSlider positions and their values:")
    for pos in [0, 25, 50, 75, 100]:
        val = slider.position_to_value(pos)
        print(f"  Position {pos:3d} → Value {val:.4f}")
    
    # Test symmetry: equal movements from center
    left_20_percent = slider.position_to_value(30)   # 20% left of center
    right_20_percent = slider.position_to_value(70)  # 20% right of center
    print(f"\nSymmetry test:")
    print(f"  20% left of center:  {left_20_percent:.4f}")
    print(f"  20% right of center: {right_20_percent:.4f}")
    print(f"  Their product: {left_20_percent * right_20_percent:.4f}")  # Should be ~1.0
```

---

## Human-Centric Pseudocode

### The Core Concept

```
LOGARITHMIC SLIDER EXPLANATION:

We want to map a slider (which moves linearly from 0% to 100%)
to values that span many orders of magnitude (like 0.1 to 10)
in a way that feels symmetric and natural.

The key insight: Work in "log space" where multiplication becomes addition!
```

### Position to Value (Moving the slider → Get the value)

```
FUNCTION slider_position_to_actual_value(position):
    
    INPUTS:
        position = where the slider thumb is (0 to 100)
    
    OUTPUT:
        the actual value this position represents
    
    STEPS:
    
    1. NORMALIZE the position to a 0-to-1 scale
       (makes math easier)
       
       percentage = position ÷ 100
       
       Example: position 75 → percentage = 0.75
    
    
    2. THINK IN LOG SPACE
       Instead of thinking "what number is 75% of the way from 0.1 to 10?"
       Think "what number is 75% of the way from log(0.1) to log(10)?"
       
       log_of_min = log₁₀(minimum_value)
       log_of_max = log₁₀(maximum_value)
       
       For range 0.1 to 10:
           log_of_min = log₁₀(0.1) = -1
           log_of_max = log₁₀(10) = +1
    
    
    3. INTERPOLATE in log space
       (Find the spot between -1 and +1)
       
       log_result = log_of_min + (percentage × distance_in_log_space)
       
       where distance_in_log_space = log_of_max - log_of_min
       
       Example: 75% position with range 0.1 to 10:
           log_result = -1 + (0.75 × 2) = -1 + 1.5 = 0.5
    
    
    4. CONVERT BACK from log space to normal space
       (Turn log(result) back into result)
       
       actual_value = 10^(log_result)
       
       Example: 10^0.5 = 3.162
       
       So slider at 75% → value is 3.162
    
    
    RETURN actual_value

END FUNCTION
```

### Value to Position (Have a value → Find slider position)

```
FUNCTION actual_value_to_slider_position(value):
    
    INPUTS:
        value = the actual number we want to represent
    
    OUTPUT:
        where the slider should be (0 to 100)
    
    STEPS:
    
    1. CONVERT the value to log space
       
       log_of_value = log₁₀(value)
       
       Example: value = 2.0
           log_of_value = log₁₀(2) = 0.301
    
    
    2. FIGURE OUT where this sits in the log range
       (As a percentage from min to max in log space)
       
       log_of_min = log₁₀(minimum_value)
       log_of_max = log₁₀(maximum_value)
       
       percentage = (log_of_value - log_of_min) ÷ (log_of_max - log_of_min)
       
       Example: value = 2.0 in range 0.1 to 10:
           percentage = (0.301 - (-1)) ÷ (1 - (-1))
                      = 1.301 ÷ 2
                      = 0.6505
    
    
    3. SCALE to slider range (0 to 100)
       
       position = percentage × 100
       
       Example: 0.6505 × 100 = 65.05
       
       So value 2.0 → slider position 65
    
    
    RETURN position

END FUNCTION
```

---

## Visual Explanation with Numbers

Let's trace through a complete example:

**Setup:** Slider ranging from 0.1 to 10

```
LINEAR SPACE (what we see):
    0.1 ←――――――――――→ 10
    
LOG SPACE (where we actually work):
    -1 ←――――――――――→ +1
    
Why? Because log₁₀(0.1) = -1 and log₁₀(10) = +1
```

**Converting position 50 (center) to value:**

```
Step 1: Normalize
    percentage = 50 ÷ 100 = 0.5

Step 2: Think in log space
    log_min = -1
    log_max = +1
    distance = +1 - (-1) = 2

Step 3: Interpolate in log space
    log_result = -1 + (0.5 × 2) = -1 + 1 = 0

Step 4: Convert back
    value = 10^0 = 1.0
    
ANSWER: Center of slider (position 50) = 1.0
```

**Converting value 4.0 to position:**

```
Step 1: Convert to log space
    log_of_4 = log₁₀(4) = 0.602

Step 2: Figure out percentage
    percentage = (0.602 - (-1)) ÷ (1 - (-1))
               = 1.602 ÷ 2
               = 0.801

Step 3: Scale to position
    position = 0.801 × 100 = 80.1
    
ANSWER: Value 4.0 appears at position 80 on the slider
```

---

## Why This Works: The Magic of Logarithms

```
IN LINEAR SPACE:
    Going from 1 to 2 is adding 1
    Going from 1 to 0.5 is subtracting 0.5
    These are DIFFERENT operations!

IN LOG SPACE:
    Going from 1 to 2:
        log(1) to log(2) = 0 to 0.301 (adding 0.301)
    
    Going from 1 to 0.5:
        log(1) to log(0.5) = 0 to -0.301 (subtracting 0.301)
    
    These are SYMMETRIC operations!

This is why the slider feels natural - 
multiplication and division become symmetric in log space!
```

---

## Mental Model

Think of the slider as having "zones" that represent multipliers:

```
LINEAR SLIDER (what you see):
[══════════════════════════════════]
0                50               100

WHAT IT REPRESENTS:
[0.1 0.25 0.5 1.0 2.0 4.0 10]
 ÷10  ÷4   ÷2   ×1  ×2  ×4  ×10

Moving the slider by equal amounts multiplies/divides by equal ratios!
```

---

## Real-World Analogy

**Volume knob on stereo:**
- Turn left from center: Half volume, quarter volume, eighth volume...
- Turn right from center: Double volume, quadruple volume, 8× volume...
- Equal turns = equal multipliers
- This is why volume knobs use logarithmic scales (dB)!

**Zoom in design software:**
- Zoom out: 100% → 50% → 25% → 12.5%...
- Zoom in: 100% → 200% → 400% → 800%...
- Each step multiplies by 2 (or divides by 2)
- Equal movements = equal zoom factors

**The slider does the same thing!**
