import { style, animate, transition, trigger, keyframes } from '@angular/animations';
export class Animations {
  public static popupIn = [
    trigger('popupIn', [
      transition(':enter', [
        animate('350ms ease-in-out', keyframes([
          style({ transform: 'scale(0)' }),
          style({ transform: 'scale(1)', opacity: 1 }),
        ]))
      ])
    //   transition(':leave', [
    //     animate('500ms ease-in-out', keyframes([
    //       style({ transform: 'scale(1)' }),
    //       style({ transform: 'scale(0)', opacity: 0 })
    //     ]))
    //   ]),
    ])
  ];
  public static popupOut = [
    trigger('popupOut', [
      transition(':leave', [
        animate('350ms ease-in-out', keyframes([
          style({ opacity: 0 })
        ]))
      ]),
    ])
  ];


}​​​
