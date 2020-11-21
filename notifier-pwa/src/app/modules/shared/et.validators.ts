import { AbstractControl, Validators } from '@angular/forms';

export class EtValidators {
    static ValidateConfirmPassword(AC: AbstractControl) {   
        if(!AC.get('password') || !AC.get('confirmPassword')) {
            return;
        } 
        let password = AC.get('password').value;
        let confirmPassword = AC.get('confirmPassword').value;

        // if(password) {
        //     AC.get('password').setErrors(null);
        // } else {
        //     AC.get('password').setErrors({ valid: true });
        // }
        // if(confirmPassword) {
        //     AC.get('confirmPassword').setErrors(null);
        // } else {
        //     AC.get('confirmPassword').setErrors({ valid: true });
        // }
        //password
        if(password && confirmPassword && password != confirmPassword) {
            AC.get('confirmPassword').setErrors({ confirmPasswordError: true });
        } 
        // else {
        //     AC.get('confirmPassword').setErrors(null);
        // }
        return null;
    }
} 