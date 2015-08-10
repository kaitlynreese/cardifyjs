# cardify.js

> A jQuery plugin to create an all-in-one credit card processing component.
> This can be used by developers and designers alike!

## Demo
To demo an example of cardify, load `index.html` in the attached .zip file in any internet browser.

### Compatibility
This plugin has been tested and verified in the latest versions of Chrome and Firefox, as well as IE10.

## Getting started

This plugin requires the following included assets:

- Bootstrap `~3.3.1`
- jQuery `~1.11.2`
- jQuery UI `~1.11.4`

1. Load CSS assets into your HTML5 document `<head>`

	``` html
	<link rel="stylesheet" href="css/cardify.css">
	<link rel="stylesheet" href="css/main.css">
	```

2. Load JS source files at the end of the HTML `<body>`
	
	``` html
    <script src="js/vendor/jquery-1.11.2.min.js"></script>
    <script src="js/vendor/jquery-ui-1.11.4.min.js"></script>
    <script src="js/vendor/bootstrap.min.js"></script>

    <script src="js/jquery.cardify.js"></script>
	```

3. Initialize cardify on the desired container element (should be an empty `div` or `span`):

	``` js
	$('#credit-card-entry').cardify();
	```
	
	or with options set:
	``` js
	$('#credit-card-entry').cardify({
		width: '300px',
		onValid: function() {
            $('#submit').prop('disabled', false);
            
            $('.form').submit(function(e) {
                e.preventDefault();
                var params = $(this).serializeArray();
                
                $.post( // sample ajax call to send data
                    'INSERT_URL_HERE',
                    params,
                    function() {
                        // callback
                });
            });
        },
        onInvalid: function() {
            $('#submit').prop('disabled', true);
        }
	});
	```

## Options
> Here is a description of all basic options that can be customized in cardify.js

### spacingInterval
Type: `Number`
Default: `4`
The number of digits in each set when spaced out for credit card number entry (i.e. 4 yields spacing every four digits, 0000 0000 0000 0000).

### spacingAmount
Type: `Number`
Default: `2`
The number of spaces between each digit set for credit card number entry.

### selector
Type: `String`
Default: `'input[type="text"]'`
The selector to find inputs within the container.

### containerClass
Type: `String`
Default: `''`
Additional classes to be set on the resulting container div.

### creditCardField
Type: `String`
Default: `'credit-card-number'`
Name attribute for the input field that holds the credit card number within the form element.

### expiryField
Type: `String`
Default: `'credit-card-expiry'`
Name attribute for the input field that holds the credit card expiry date (MM/YY) within the form element.

### cvvField
Type: `String`
Default: `'credit-card-cvv'`
Name attribute for the input field that holds the credit card CVV within the form element.

### zipField
Type: `String`
Default: `'credit-card-zip'`
Name attribute for the input field that holds the credit card zip code within the form element.

### showErrorMessage
Type: `Boolean`
Default: `false`
Enable or disable helper text when entry is invalid

### enablePlaceholder
Type: `Boolean`
Default: `true`
Enable or disable placeholder for credit card number entry

### supportedCardTypes
Type: `JSON`
Default:
``` js
{
	amex: {
        regExp: '^3[47][0-9]{5,}$',
        maxLength: 15,
        cvvLength: 4
    },
    discover: {
        regExp: '^6(?:011|5[0-9]{2})[0-9]{3,}$',
        maxLength: 16,
        cvvLength: 3
    },
    mastercard: {
        regExp: '^5[1-5][0-9]{5,}$',
        maxLength: 16,
        cvvLength: 3
    },
    visa: {
        regExp: '^4[0-9]{6,}$',
        minLength: 13,
        maxLength: 16,
        cvvLength: 3
    },
    default: {
        regExp: '/^\d+$/',
        minLength: 16,
        maxLength: 16,
        cvvLength: 3
    }
}
```
JSON structure to define various settings that are unique for each credit card type.
The parameters within `supportedCardTypes` are defined as follows:

#### regExp
Type: `String`
Regular Expression pattern to identify credit card type. Defaults were derived from http://goo.gl/edXeHu

#### minLength
Type: `Number`
Minimum number of digits in credit card number for this card type

#### regExp
Type: `Number`
Maximum number of digits in credit card number for this card type

#### regExp
Type: `Number`
Expected number of digits in CVV for this card type

## Events

### onValid
Type: `Function`
Default: `function() {}`
Callback function to be called when all credit card data has been successfully collected.

### onIncomplete
Type: `Function`
Default: `function() {}`
Callback function to be called when credit card data has been entered but remain incomplete.

### onInvalid
Type: `Function`
Default: `function() {}`
Callback function to be called when credit card data has been entered and contains invalid data.

### onChangeCardType
Type: `Function`
Default: `function() {}`
Callback function to be called when credit card entry has changed the credit card type (i.e. Visa, Mastercard, etc.)

## Manipulation

> These functions and variables can be accessed from the returned cardify object after initialization as follows:

``` js
	var cardify = $('#credit-card-entry').cardify();
	cardify.getStep($('.cardify-input').first()); // returns 1 or 2
```

### init
Type: `Function`
Refreshes the cardify instance

### update
Type: `Function`
Parameters:
* *options* - (JSON) updated settings to apply changes to existing settings
* *refresh* - (Boolean) whether or not to refresh after settings update

Update settings and refreshes the cardify instance

### getStep
Type: `Function`
Parameters:
* *$input* - (jQuery) input element of which to get the current step 

Get the current step (1 or 2) of the provided input

### setStep
Type: `Function`
Parameters:
* *$input* - (jQuery) input element of which to get the current step 
* *stepNum* - (Number) numerical representation of which step to set

Set the current step (1 or 2) of the provided input. Step 1 is credit card number entry and Step 2 is expiration date, CVV and zip code entry.

### luhnTest
Type: `Function`
Parameters:
* *cardNumber* - (Number or String) credit card number to validate against the Luhn Algorithm

For validation purposes, this function can be used to validate any credit card number against the Luhn Algorithm for credit card validation.

> Reference:
> http://rosettacode.org/wiki/Luhn_test_of_credit_card_numbers