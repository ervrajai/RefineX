import re

from django.core.exceptions import ValidationError
from django.utils.translation import gettext as _


class StrictPasswordValidator:
    min_length = 8
    max_length = 15

    def validate(self, password, user=None):
        errors = []

        if len(password) < self.min_length:
            errors.append(
                ValidationError(
                    _("Password must be at least %(min_length)d characters long."),
                    code="password_too_short",
                    params={"min_length": self.min_length},
                )
            )

        if len(password) > self.max_length:
            errors.append(
                ValidationError(
                    _("Password must be no more than %(max_length)d characters long."),
                    code="password_too_long",
                    params={"max_length": self.max_length},
                )
            )

        if not re.search(r"[A-Z]", password):
            errors.append(
                ValidationError(
                    _("Password must contain at least one uppercase letter."),
                    code="password_missing_uppercase",
                )
            )

        if not re.search(r"[^A-Za-z0-9]", password):
            errors.append(
                ValidationError(
                    _("Password must contain at least one special character."),
                    code="password_missing_special",
                )
            )

        if errors:
            raise ValidationError(errors)

    def get_help_text(self):
        return _(
            "Your password must be 8-15 characters long and include at least one "
            "uppercase letter and one special character."
        )
