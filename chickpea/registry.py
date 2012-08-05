from chickpea import base_models

REGISTRY = {}


def register(cls, name=None):
    """
    Simple class decorator.
    Use it to define your proper Marker class.
    eg.:
    @register('Marker')
    class MyClass(AbstractMarker):
        ...
    WARNING:
    - your app must be *before* chickpea in INSTALLED_APPS to do so.
    """
    if not name:
        name = cls.__name__
    global REGISTRY
    REGISTRY[name] = cls
    return cls


def get_model(name):
    """
    Get model from REGISTRY, or, if not present,
    import default from base_models.
    """
    global REGISTRY
    if not name in REGISTRY:
        REGISTRY[name] = getattr(base_models, name)
    return REGISTRY[name]
