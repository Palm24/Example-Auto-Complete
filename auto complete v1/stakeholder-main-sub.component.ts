import {
  SwalAlertErrors,
  SwalAlertSuccess,
  SweetAlertConfirm,
} from "src/app/utility/sweetAlert";
import {
  AfterViewInit,
  Component,
  Input,
  OnDestroy,
  OnInit,
} from "@angular/core";
import { FormControl } from "@angular/forms";
import { of, Subscription } from "rxjs";
import { StakeholderService } from "../../services";
import { Observable, EMPTY } from "rxjs";
import { map, startWith, switchMap, tap, } from "rxjs/operators";
import { ConstantHelper } from "src/app/constant/constantHelper";

interface StakeholderItem {
  uid: string;
  desc: string;
}

interface StakeholderForm {
  groupCode: string;
  searchCtrl: FormControl;
  dropdown: StakeholderItem[];
  display$: Observable<StakeholderItem[]>;
  newValue: StakeholderItem;
  isNewValid: any;
}

const IS_NEW_VALID = (form: StakeholderForm) => {
  let text = null;
  switch (typeof (form.searchCtrl.value)) {
    case "string":
      text = form.searchCtrl.value
      break;
    default:
      text = (form.searchCtrl.value as StakeholderItem).desc;
      break;
  }

  if (!text)
    return false;

  return !form.dropdown.some(a => a.desc === text);
}

@Component({
  selector: "stakeholder-mainsub-selector",
  templateUrl: "./stakeholder-main-sub.component.html",
})
export class StakeholderComponent implements OnInit, OnDestroy {
  @Input() mainControl: FormControl;
  @Input() subControl: FormControl;

  main: StakeholderForm = {
    groupCode: ConstantHelper.StakeholderStatus.Header,
    searchCtrl: new FormControl(""),
    dropdown: [] as StakeholderItem[],
    display$: new Observable(),
    newValue: {} as StakeholderItem,
    isNewValid: IS_NEW_VALID
  };

  sub: StakeholderForm = {
    groupCode: ConstantHelper.StakeholderStatus.Sub,
    searchCtrl: new FormControl(""),
    dropdown: [] as StakeholderItem[],
    display$: new Observable(),
    newValue: {} as StakeholderItem,
    isNewValid: IS_NEW_VALID
  };

  constructor(private service: StakeholderService) { }

  ngOnInit() {
    this.main.display$ = this.service.getHeader().pipe(
      tap((items: StakeholderItem[]) => (this.main.dropdown = items)),
      switchMap(() => this.main.searchCtrl.valueChanges.pipe(startWith(""))),
      map((data: string | StakeholderItem) => {
        if (typeof data === "string")
          return this.filterStakeholder(data, this.main.dropdown);
        else
          return this.filterStakeholder(data.desc, this.main.dropdown);
      })
    );
  }

  ngOnDestroy(): void { }

  // #region autocomplete
  filterStakeholder(value: string, items: StakeholderItem[]): StakeholderItem[] {
    const filterValue = value.toLowerCase();
    return items.filter((a: StakeholderItem) => a.desc.toLowerCase().indexOf(filterValue) === 0);
  }

  displayStakeholder(item: StakeholderItem): string | StakeholderItem {
    return item ? item.desc : item;
  }

  autoCompleteClosed(form: StakeholderForm) {
    if (typeof (form.searchCtrl.value) === "string")
      form.searchCtrl.setValue("");
  }

  emptyIfNotMatch(form: StakeholderForm): void {
    if (typeof (form.searchCtrl.value) !== "string") return;
    if (!form.dropdown.some(({ desc }) => desc === form.searchCtrl.value))
      form.searchCtrl.setValue("");
  }
  // #endregion

  onSave(form: StakeholderForm) {
    console.log(form.searchCtrl.value);
    // to save
    // this.service.create().subscribe(
    //   (item: StakeholderItem) => {
    //     form.dropdown.push(item);
    //     form.searchCtrl.setValue(item);
    //     if(form.groupCode){
    //       this.mainControl.setValue(item.uid);
    //     }
    //   }
    // );
  }
}
