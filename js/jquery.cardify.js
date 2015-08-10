/*!
 * cardify.js
 * Author: Kaitlyn Reese
 * 
 * Requirements:
 * cardify.css
 * jQuery and jQuery UI Effects (Shake)
 * Bootstrap 3
 * cardlogo_sprite.png
 */

(function ($) {
 
$.fn.cardify = function(options) {
    /**  LOCAL VARIABLES */
    
    // Default settings sett
    var defaults = {
        spacingInterval: 4, // spaces
        spacingAmount: 2, // number of spaces between every interval of digits
        selector: 'input[type="text"]', // jQuery selector to find credit card inputs, can define custom class or id
        containerClass: '', // additional classes on container div
        creditCardField: 'credit-card-number',
        expiryField: 'credit-card-expiry',
        cvvField: 'credit-card-cvv',
        zipField: 'credit-card-zip',
        supportedCardTypes: {
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
        }, // supported cards with their RegExp pattern and maxLength
        onValid : function() {},
        onIncomplete: function() {},
        onInvalid: function() {},
        onChangeCardType: function() {},
        showErrorMessage: false,
        enablePlaceholder: true
    };
    var settings = $.extend(true, defaults, options); // add and overwrite user settings to defaults
    
    var inputSettings = { // settings to disable default browser input field behavior
        'autocomplete': 'off',
        'autocorrect': 'off',
        'autocapitalize': 'off'
    };
    
    var cardify = {}; // cardify object
    var $collection = this;
    
    var spc, 
        $inputs; // dynamic variables that are global to the cardify instance, set in init()
    
    
    /**  CARDIFY FUNCTIONS, will be returned to caller */
    
    var init = function() {
        $inputs = $collection.find(settings.selector).addBack(settings.selector); // find inputs including the collection itself
        
        spc = new Array(settings.spacingAmount + 1).join(' '); // calculate string for spaces separating card number
        
        $inputs // setup main cardify input
            .addClass('cardify-input')
            .attr($.extend({}, inputSettings, {
                'maxlength': getMaxLength(settings.supportedCardTypes.default.maxLength),
                'data-step': 1
            }))
            .wrap($('<div class="cardify form-group ' + settings.containerClass + '"><div class="cardify-wrapper"></div></div>'))
            .after( // insert input field siblings
                '<div class="cardify-card-logo"></div>', // card identifier logo
                '<span class="cardify-placeholder cardify-card-placeholder">' + (settings.enablePlaceholder ? getCardPlaceholder() : '') + '</span>', // placeholder text for step 1
                '<span class="glyphicon glyphicon-ok form-control-feedback"></span>', // glyphicon for various UX feedback
                '<input type="hidden" class="cardify-field" name="' + settings.creditCardField + '">', // hidden field for form processing of credit card number
                '<div class="metadata"></div>') // container for inputs for step 2
            .on('input', function(e) { // fire event when any changes made to value in main input field for step 1
                e.stopImmediatePropagation();
                var $input = $(this);
            
                // only valid for step 1
                if($input.closest('.cardify').hasClass('processing') || getStep($input) != '1')
                    return false;
            
                var val = $input.val();
            
                // Handle special keypresses
                var newChar = e.which != 0 ? e.which : val.charCodeAt(val.length - 1); // fix for firefox registering characters as 0
                if(newChar < 48 || newChar == 67 || newChar == 88 || newChar == 86) // if any non-character keys pressed, do not validate
                    return false;
                /*if(newChar <= 90 && newChar >= 65) { // restrict entry to only digits, shake. not a good idea to do this, too restrictive for shortcuts.
                    $input.closest('.cardify').effect('shake', { distance: 5, times: 2 });
                    return false;
                }*/
            
                // Manipulate value and handle input
                val = $input.val().replace(/\s/g, ''); // remove spaces
            
                validateCard($input, val); // process card input
                var cardType = checkCardType($input, val); // check card type (visa, mc, etc.) and update icon
                updateCardPlaceholder($input.siblings('.cardify-card-placeholder'), val, cardType); // update placeholder based on input and card type
            
                var array = val.match(/.{1,4}/g) || []; // split value every 4 characters
            
                var selection = getSelection($input); // preserve cursor location
                var newVal = array.join(spc);
                $input.val(newVal); // add spaces, push to input
                var start = selection.start + (selection.start >= val.length && val.length < newVal.length ? settings.spacingAmount : 0);
                setSelection($input, start, start);
            });
        
        var $containers = $inputs.closest('.cardify');
        
        var $metadata = $containers.find('.metadata').append(
            '<span class="metadata-wrapper"><input type="text" class="cardify-field" data-index="0" data-placeholder="MM/YY" name="' + settings.expiryField + '"></span>',
            '<span class="metadata-wrapper"><input type="text" class="cardify-field" data-index="1" data-placeholder="CVV" name="' + settings.cvvField + '"></span>',
            '<span class="metadata-wrapper"><input type="text" class="cardify-field" data-index="2" data-placeholder="ZIP" name="' + settings.zipField + '"></span>');
        $metadata.find('.cardify-field')
            .attr(inputSettings)
            .each(function() {
                var $metadataInput = $(this);
                var metadataPlaceholder = $metadataInput.attr('data-placeholder');
                $metadataInput.after('<span class="cardify-placeholder" data-default="' + metadataPlaceholder + '">' + metadataPlaceholder + '</span>');
            })
            .on('input', function(e) { // fire event when any changes made to values in metadata input fields for step 2
                e.stopImmediatePropagation();
                var $field = $(this);
                var val = $field.val();
        
                // Handle special keypresses
                var newChar = e.which != 0 ? e.which : val.charCodeAt(val.length - 1); // fix for firefox registering characters as 0
                if(newChar < 48 || newChar == 67 || newChar == 88 || newChar == 86) // if any non-character keys pressed, do not validate
                    return false;
            
                validateMetadata($field);
                
                var index = $field.attr('data-index');
                var inputLength = val.length;
                if(index != 0 && inputLength == 0) // when removing input, if focused field has no value, return to previous field
                    $field.closest('.metadata').find('.cardify-field[data-index="' + (parseInt(index) - 1) + '"]').focus();
                else if($field.attr('data-valid') == 'true' && index != 2 && inputLength >= $field.attr('maxlength')) // when adding input, if focused field has the maximum length value, advance to next field
                    $field.closest('.metadata').find('.cardify-field[data-index="' + (parseInt(index) + 1) + '"]').focus();
            })
            .on('focus blur', function(e) { // fire event when metadata input field go in or out of focus, to apply style to main card input field
                $(this).closest('.cardify').find('.cardify-input').toggleClass('focus', e.type == 'focus');
            });
        
        $containers.find('.cardify-card-placeholder').each(function() {
            var $placeholder = $(this);
            var $input = $placeholder.siblings('.cardify-input, .cardify-field');
            $placeholder.css({ // Match CSS styles to input for placeholder overlay
                fontFamily: $input.css('font-family'),
                fontSize: $input.css('font-size'),
                fontWeight: $input.css('font-weight')
            });
            $placeholder.click(function(e) {
                e.preventDefault();
                e.stopPropagation();
                $input.focus();
            });
        });
        
        if(settings.showErrorMessage)
            $containers.append('<label class="control-label">Please enter a valid card number.</label>');
    };
    
    var update = function(options, refresh) {
        settings = $.extend(true, defaults, options);
        if(refresh)
            init();
    };
    
    var getStep = function($input) {
        return Number($input.attr('data-step'));
    };
    
    var setStep = function($input, stepNum) {
        var $container = $input.closest('.cardify');
        
        if($container.hasClass('processing'))
            return false;
        else
            $container.addClass('processing');
        
        var $placeholder = $container.find('.cardify-card-placeholder').fadeOut(100);
        var $metadata = $container.find('.metadata').fadeOut(100);
        
        if(stepNum == 2)
            $input.delay(500);
        
        $container.find('.cardify-lastFourDigits').fadeOut(100, function() {
            $(this).remove();
        });
        $input.animate({ color: '#ffffff' }, 300, function() {
            $input.closest('.form-group').removeClass('has-success has-error has-feedback');
            
            switch(stepNum) {
                case 1:
                    $input.attr('data-step', 1).removeClass('preventSelection');
                    
                    var cardValue = $container.find('input.cardify-field[name="' + settings.creditCardField + '"]').val();
                    $input.animate({ color: '#000000' }, 100).focus().addClass('holdProgression').trigger('input'); // returning to step 1, hold automatic progression
                    
                    $container.find('.glyphicon').removeClass('glyphicon-ok').addClass('glyphicon-arrow-right').click(function() {
                        if($container.hasClass('processing'))
                            return false;
                        
                        setStep($input, 2);
                        $input.focus();
                    }); // convert glyph to proceed button
                    
                    $placeholder.fadeIn(100);
                    break;
                case 2:
                    $input.attr('data-step', 2).addClass('preventSelection');
                    
                    var cardValue = $container.find('input.cardify-field[name="' + settings.creditCardField + '"]').val();
                    
                    $container.find('.cardify-lastFourDigits').remove(); // remove any instances of last 4 digits
                    $('<span class="cardify-lastFourDigits">' + cardValue.substr(cardValue.length - 4) + spc + '</span>')
                        .insertAfter($input)
                        .click(function() {
                            if($container.hasClass('processing'))
                                return false;
                            
                            setStep($input, 1);
                        })
                        .css({ // Match CSS styles to input for last 4 digits overlay
                            fontFamily: $input.css('font-family'),
                            fontSize: $input.css('font-size'),
                            fontWeight: $input.css('font-weight')
                        });
                    
                    $container.find('.glyphicon').addClass('glyphicon-ok').removeClass('glyphicon-arrow-right'); // convert glyph to validation
                    
                    $metadata.fadeIn(100)
                        .find('.cardify-field').each(function() {
                            var $field = $(this);
                            var cardType = settings.supportedCardTypes[$input.attr('data-cardtype') || 'default'];
                            var lengthOfSections = [5, cardType.cvvLength, 5]; // acceptable char length of each input section for step 2
                            $field.attr('maxlength', lengthOfSections[$field.attr('data-index')]);
                        })
                        .first().trigger('input').focus();
                    break;
                default:
                    break;
            }
            
            $(':animated').promise().done(function() {
                $container.removeClass('processing');
            });
            return true;
        });
    };
    
    var luhnTest = function(cardNumber){
        if(isNaN(cardNumber))
            return false;

        var sumArray = function(a) {
            var sum = 0;
            for(var i = 0; i < a.length; i++)
                sum += parseInt(a[i]);
            return sum;
        };

        var applyToArray = function(a, fn) {
            var applied = [];
            for(var i = 0; i < a.length; i++)
                applied.push(fn(a[i]));
            return applied;
        };

        var reverse = (cardNumber + '').split('').reverse();
        var odd = [], even = [];

        for(var i = 0; i < reverse.length; i++) {
            ((i + 1) % 2 === 0 ? even : odd).push(reverse[i]);
        }

        var s1 = sumArray(odd);
        var s2 = sumArray(applyToArray(applyToArray(even, function(n){
            return n * 2;
        }), function(n) {
            return sumArray((n + '').split(''));
        }));

        return (s1 + s2) % 10 === 0;
    };
    
    
    /**  LOCAL FUNCTIONS */
    
    var getCardPlaceholder = function(cardType) {
        var maxLength = settings.supportedCardTypes[cardType || 'default'].maxLength;
        var cardPlaceholderSet = new Array(settings.spacingInterval + 1).join('0');
        
        var cardPlaceholderArray = [];
        for(var i = 0; i < Math.floor(maxLength / settings.spacingInterval); i++)
            cardPlaceholderArray.push(cardPlaceholderSet);
        
        var remainder = maxLength % settings.spacingInterval;
        if(remainder != 0)
            cardPlaceholderArray.push(new Array(remainder + 1).join('0')); // push remainder
        
        return cardPlaceholderArray.join(spc);
    };
    
    var updateCardPlaceholder = function($placeholder, val, cardType) {
        var placeholderText = getCardPlaceholder(cardType); // regenerate to prevent errors
        var placeholderArray = placeholderText.split('0');
        $placeholder.html('<span class="invisible">' + placeholderArray.slice(0, val.length + 1).join('0').replace(/\s*$/, "") + '</span>' + placeholderArray.slice(val.length).join('0')); // Split placeholder by how many characters have been entered, trimming extra whitespace
    };
    
    var getMaxLength = function(n) {
        return n + Math.ceil(n / settings.spacingInterval - 1) * settings.spacingAmount;
    };
    
    var checkCardType = function($input, val) {
        var matched = false;
        var $image = $input.siblings('.cardify-card-logo');
        var cardClasses = Object.keys(settings.supportedCardTypes).join(' ');
        for(cardKey in settings.supportedCardTypes) {
            if(settings.supportedCardTypes.hasOwnProperty(cardKey)) {
                var cardType = settings.supportedCardTypes[cardKey];
                var regExp = new RegExp(cardType.regExp);
                if(regExp.test(val)) {
                    matched = cardKey;
                    if($image.hasClass(matched))
                        return matched; // returns first match, no need for animation
                    
                    $image.fadeOut(100, function() {
                        $image
                            .removeClass(cardClasses) // remove card type class
                            .addClass(matched)
                            .fadeIn(100);
                    }); // add new card type class
                    
                    $input
                        .attr('data-cardtype', cardKey)
                        .attr('maxlength', getMaxLength(cardType.maxLength));
                    
                    settings.onChangeCardType();
                }
            }
        }
        if(!matched) {
            var previouslyMatched = false;
            for(var cardKey in settings.supportedCardTypes) {
                if(settings.supportedCardTypes.hasOwnProperty(cardKey)) {
                    if($image.hasClass(cardKey))
                        previouslyMatched = true;
                }
            }
            if(!previouslyMatched)
               return matched;
            
            $image.fadeOut(100, function() {
                $image
                    .removeClass(cardClasses) // remove card type class
                    .fadeIn(100);
            });
            
            $input
                .removeAttr('data-cardtype')
                .attr('maxlength', getMaxLength(settings.supportedCardTypes.default.maxLength));
        }
        return matched;
    };
    
    var validateCard = function($input, val) {
        var $formGroup = $input.closest('.form-group');
        $formGroup.removeClass('has-success has-error has-feedback');
        $input.siblings('input.cardify-field[name="' + settings.creditCardField + '"]').val('');
        
        var cardType = settings.supportedCardTypes[$input.attr('data-cardtype') || 'default'];
        
        if(val && val.length >= (cardType.minLength || cardType.maxLength) && luhnTest(val)) {
            $input.siblings('input.cardify-field[name="' + settings.creditCardField + '"]').val(val);
            $formGroup.addClass('has-success');
            
            if(val.length == cardType.maxLength && !$input.hasClass('holdProgression') && getStep($input) == '1')
                setStep($input, 2);
                
        } else if(isNaN(val) || val.length == cardType.maxLength)
            handleInvalid($input);
    };
    
    var validateMetadata = function($field) {
        if($field.val().length > 0) // hide placeholder on first character, due to variable character widths
            $field.siblings('.cardify-placeholder').hide();
        else
            $field.siblings('.cardify-placeholder').show();
        
        var $formGroup = $field.closest('.form-group');
        $formGroup.removeClass('has-success has-error has-feedback');
        
        // validate entered metadata groups
        var sectionProcessors = [validateExpiry, validateCVV, validateZip];
        var sectionFields = [settings.expiryField, settings.cvvField, settings.zipField];
        
        var index = $field.attr('data-index');
        var thisValid = sectionProcessors[index]($field);
        $field.attr('data-valid', thisValid);
        
        var $successFields = $field.closest('.metadata').find('.cardify-field[data-valid="true"]');
        if($successFields.length == 3) { // if all metadata fields successful, credit card processing is done!
            $formGroup.addClass('has-success');
            settings.onValid();
        } else
            settings.onIncomplete();
    };
    
    var validateExpiry = function($field) {
        var expiry = $field.val();
        if(!expiry)
            return false;
        
        if(isNaN(expiry.replace(/\//g, ''))) { // invalid if not a number
            handleInvalid($field);
            return false;
        }
        
        if(expiry.indexOf('/') === -1) { // if expiry does not already contain slash
            var array = expiry.match(/.{1,2}/g) || []; // split value at 2 chars
            expiry = array.join('/'); // insert slash, push to val
        }
        
        $field.val(expiry); // replace value with slash processing
        
        var expiryArray = expiry.split('/');
        
        if((expiryArray[0] && expiryArray[0].length != 2) || (expiryArray[1] && expiryArray[1].length != 2)) // Token not finished if not two characters, no error state though
            return false;
        
        if((expiryArray[0] && !isNaN(expiryArray[0])) || (expiryArray[1] && !isNaN(expiryArray[1]))) { // Check entry to ensure numbers
            if(expiryArray.length != 2 || expiryArray[0] == '' || expiryArray[1] == '') // Array has two tokens, MM and YY, and non values are okay
                return false;
            
            if(Number(expiryArray[0]) > 0 && Number(expiryArray[0]) < 13) { // Month is correct value
                var date = new Date('20' + expiryArray[1], Number(expiryArray[0]) - 1, '01');
                if(new Date().getTime() < date.getTime()) // expiry is in the future, valid
                    return true;
            }
        }
        
        // if gets to this point, must have been invalid...
        handleInvalid($field);
        return false;
    };
    
    var validateCVV = function($field) {
        var cvv = $field.val();
        
        if(isNaN(cvv))
            handleInvalid($field);
        else if(cvv.length >= $field.attr('maxlength'))
            return true;
        
        return false;
    };
    
    var validateZip = function($field) {
        var zip = $field.val();
        
        if(isNaN(zip))
            handleInvalid($field);
        else if(zip.length >= $field.attr('maxlength'))
            return true;
        
        return false;
    };
    
    var handleInvalid = function($el) {
        $el.closest('.form-group').addClass('has-error has-feedback');
        
        var $container = $el.closest('.cardify');
        if(!$container.is(':animated'))
            $container.effect('shake', { distance: 3, times: 1 });
        settings.onInvalid();
    };
    
    var getSelection = function($text) {
        var el = $text.get(0);
        return {
            $text: $text,
            start: el.selectionStart,
            end: el.selectionEnd
        };
    };
    
    var setSelection = function($text, start, end) {
        var el = $text.get(0);
        el.selectionStart = start;
        el.selectionEnd = end;
    };
    
    
    /**  INSTANTIATION */
    
    init(); // initialize cardify on the collection
    
    // Return the cardify object
    return {
        init: init,
        update: update,
        $collection: $collection,
        $inputs: $inputs,
        getStep: getStep,
        setStep: setStep,
        luhnTest: luhnTest
    };
};
 
}(jQuery));