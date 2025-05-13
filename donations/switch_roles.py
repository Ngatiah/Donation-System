# from django.shortcuts import render, redirect
# from django.contrib.auth.decorators import login_required
# from django.contrib import messages

# @login_required
# def switch_role(request):
#     if request.method == 'POST':
#         user = request.user
#         new_role = 'recipient' if user.role == 'donor' else 'donor'
#         user.role = new_role
#         user.save()
#         messages.success(request, f"Your role has been changed to {new_role}.")
#         return redirect('profile')  # Or redirect to wherever is appropriate
#     return render(request, 'switch_role.html')
