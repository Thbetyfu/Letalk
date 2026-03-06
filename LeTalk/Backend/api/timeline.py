import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import jwt
import os
from datetime import datetime
from pymongo import MongoClient
import uuid

# MongoDB Connection
client = MongoClient(os.getenv('MONGODB_URI'))
db = client['Letalk']
users_collection = db['users']
timeline_collection = db['timeline']

JWT_SECRET = os.getenv('JWT_SECRET', 'letalk-dev-secret')
JWT_ALGORITHM = 'HS256'

@csrf_exempt
def get_timeline(request):
    if request.method != 'GET':
        return JsonResponse({'error': 'Only GET allowed'}, status=405)
    
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return JsonResponse({'error': 'Missing Authorization'}, status=401)
        
        token = auth_header.split(' ')[1]
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user = users_collection.find_one({'email': payload['email']})
        
        if not user or not user.get('partnerCode'):
            return JsonResponse({'events': []})
        
        pair_code = user['partnerCode']
        events = list(timeline_collection.find({'pairCode': pair_code}).sort('date', 1))
        
        # Convert ObjectId & dates for JSON serialization
        for event in events:
            event['id'] = str(event.get('_id'))
            del event['_id']
            if isinstance(event.get('date'), datetime):
                event['date'] = event['date'].isoformat()
        
        return JsonResponse({'events': events}, status=200)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

@csrf_exempt
def create_timeline_event(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'Only POST allowed'}, status=405)
    
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return JsonResponse({'error': 'Missing Authorization'}, status=401)
        
        token = auth_header.split(' ')[1]
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user = users_collection.find_one({'email': payload['email']})
        
        if not user or not user.get('partnerCode'):
            return JsonResponse({'error': 'You must be paired to add events'}, status=403)
        
        data = json.loads(request.body)
        title = data.get('title')
        description = data.get('description')
        date_str = data.get('date')
        location = data.get('location', '')
        image_url = data.get('imageUrl', '')
        is_special = data.get('isSpecial', False)
        
        if not title or not description or not date_str:
            return JsonResponse({'error': 'Title, description and date are required'}, status=400)
        
        event_date = datetime.fromisoformat(date_str.replace('Z', '+00:00'))
        
        new_event = {
            'pairCode': user['partnerCode'],
            'title': title,
            'description': description,
            'date': event_date,
            'location': location,
            'imageUrl': image_url,
            'createdBy': user.get('name', 'User'),
            'createdByEmail': user['email'],
            'isSpecial': is_special,
            'createdAt': datetime.utcnow()
        }
        
        result = timeline_collection.insert_one(new_event)
        new_event['id'] = str(result.inserted_id)
        del new_event['_id']
        new_event['date'] = new_event['date'].isoformat()
        new_event['createdAt'] = new_event['createdAt'].isoformat()
        
        return JsonResponse(new_event, status=201)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

@csrf_exempt
def update_timeline_event(request, event_id):
    if request.method != 'PUT':
        return JsonResponse({'error': 'Only PUT allowed'}, status=405)
    
    try:
        from bson import ObjectId
        auth_header = request.headers.get('Authorization')
        token = auth_header.split(' ')[1]
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user = users_collection.find_one({'email': payload['email']})
        
        data = json.loads(request.body)
        update_data = {}
        if 'title' in data: update_data['title'] = data['title']
        if 'description' in data: update_data['description'] = data['description']
        if 'date' in data: update_data['date'] = datetime.fromisoformat(data['date'].replace('Z', '+00:00'))
        if 'location' in data: update_data['location'] = data['location']
        if 'imageUrl' in data: update_data['imageUrl'] = data['imageUrl']
        if 'isSpecial' in data: update_data['isSpecial'] = data['isSpecial']
        
        result = timeline_collection.update_one(
            {'_id': ObjectId(event_id), 'pairCode': user['partnerCode']},
            {'$set': update_data}
        )
        
        if result.matched_count == 0:
            return JsonResponse({'error': 'Event not found or unauthorized'}, status=404)
            
        return JsonResponse({'message': 'Event updated successfully'}, status=200)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

@csrf_exempt
def delete_timeline_event(request, event_id):
    if request.method != 'DELETE':
        return JsonResponse({'error': 'Only DELETE allowed'}, status=405)
    
    try:
        from bson import ObjectId
        auth_header = request.headers.get('Authorization')
        token = auth_header.split(' ')[1]
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user = users_collection.find_one({'email': payload['email']})
        
        result = timeline_collection.delete_one({'_id': ObjectId(event_id), 'pairCode': user['partnerCode']})
        
        if result.deleted_count == 0:
            return JsonResponse({'error': 'Event not found or unauthorized'}, status=404)
            
        return JsonResponse({'message': 'Event deleted successfully'}, status=200)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)
