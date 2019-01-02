import { Component, OnInit } from '@angular/core';
import { AppService } from './../../app.service';
// import { FormsModule } from '@angular/forms';
// import { NgForm } from '@angular/forms';
import { FormBuilder, Validators, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastrManager } from 'ng6-toastr-notifications';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.css']
})
export class SignupComponent implements OnInit {
  public allCountries;
  public countries = [];
  // public countryCodes;
  // public countryCode;
  // public country;
  // public countryName;

  // public firstName;
  // public lastName;
  // public email;

  //form builder
 signupForm = this.fb.group({
   firstName: [null, Validators.required],
   lastName: [null, Validators.required],
   email: [null, Validators.compose([Validators.required, Validators.email])],
   password: [null, Validators.compose([Validators.required, Validators.minLength(8)])],
   country: [null, Validators.required],
   mobile: [null, Validators.compose([Validators.required, Validators.pattern(/^[0-9]{10}$/)])]
 })


  constructor( public appService: AppService,private fb: FormBuilder, public router: Router, private toastr: ToastrManager) { }

  ngOnInit() {
   this.getCountries();
    // this.getCountryCodes();
  }
 
   public getCountries() {
    this.appService.getCountryNames().subscribe((data) => {
      this.allCountries = data;
      for(let current in data) {
        let singleCountry = {
          name: data[current].toUpperCase(),
          code: current.toUpperCase()
        }
        this.countries.push(singleCountry);
      }
      // console.log(this.countries)
      this.countries = this.countries.sort((first, second) => {
        return first.name > second.name ? 1 : (first.name < second.name ?  -1 :  0)
      })
    })
  } 

/*   public getCountryCodes() {
    this.appService.getCountryNumbers().subscribe(data => {
      this.countryCodes = data;
    })
    // console.log(this.countryCodes)
   
  }
  public onChangeOfCountry() {
    
    this.countryCode = this.countryCodes[this.country];
    this.countryName = this.country
    // console.log(this.country) 

  } */
  onSubmit() {
    // TODO: Use EventEmitter with form value
    // // console.warn(this.signupForm.value);
    this.appService.signupFunction(this.signupForm.value).subscribe(apiResponse => {
      if(apiResponse.status === 200) {
        this.toastr.successToastr('SignUp Complete', 'Welcome')
        setTimeout(() => {
          this.router.navigate(['/login'])
        }, 1500);
      } else {
            this.toastr.errorToastr(apiResponse.message, 'Error')
            
      }
    }, (error) => {
      this.toastr.errorToastr("Some Error Occurred", "Error!");
      this.router.navigate(['/server-error']);
    })
  }
}